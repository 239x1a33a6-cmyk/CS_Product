import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireStudent } from "@/lib/auth/session";
import { withErrorHandler, apiResponse } from "@/lib/validation";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { autoScore, isOpenEnded } from "@/domain/assessment/scoring";
import { scoreToQuality } from "@/domain/mastery/evidence";
import { getAIService } from "@/ai";

const submitSchema = z.object({
  assessmentId: z.string().optional(),
  questionId: z.string(),
  response: z.string().min(1).max(10000),
  responseMetadata: z
    .object({
      timeSpentSeconds: z.number().optional(),
    })
    .optional(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireStudent();
  const body = await req.json();
  const data = submitSchema.parse(body);

  const [studentProfile, question] = await Promise.all([
    db.studentProfile.findUnique({ where: { userId: session.user.id } }),
    db.question.findUnique({
      where: { id: data.questionId, isActive: true },
      include: { competencyNode: { select: { id: true, title: true, misconceptions: true } } },
    }),
  ]);

  if (!studentProfile) throw new NotFoundError("StudentProfile");
  if (!question) throw new NotFoundError("Question");

  // Verify assessment ownership if assessmentId provided
  if (data.assessmentId) {
    const assessment = await db.assessment.findUnique({
      where: { id: data.assessmentId },
    });
    if (!assessment) throw new NotFoundError("Assessment");
    if (assessment.studentId !== studentProfile.id) throw new ForbiddenError();
  }

  // Auto-score objective questions
  const scored = autoScore(
    question.questionType,
    question.options as Array<{ id: string; text: string; isCorrect: boolean }> | null,
    question.correctAnswer,
    data.response
  );

  const openEnded = isOpenEnded(question.questionType);
  const evaluationStatus = scored
    ? "AUTO_EVALUATED"
    : "PENDING_AI";

  // Create the attempt (append-only)
  const attempt = await db.attempt.create({
    data: {
      assessmentId: data.assessmentId,
      questionId: data.questionId,
      studentId: studentProfile.id,
      response: data.response,
      responseMetadata: data.responseMetadata,
      isCorrect: scored?.isCorrect ?? null,
      scoreRaw: scored?.scoreRaw ?? null,
      cognitiveLevel: question.cognitiveLevel,
      evaluationStatus,
    },
  });

  // For objective questions: immediately record mastery evidence
  if (scored) {
    const quality = scoreToQuality(scored.scoreRaw, question.cognitiveLevel);
    await db.masteryEvidence.create({
      data: {
        studentId: studentProfile.id,
        competencyNodeId: question.competencyNodeId,
        evidenceType: "ASSESSMENT_ATTEMPT",
        attemptId: attempt.id,
        cognitiveLevel: question.cognitiveLevel,
        quality,
      },
    });
  }

  // For open-ended: trigger AI evaluation in background
  let aiFeedback = null;
  if (openEnded && question.referenceAnswer) {
    try {
      const aiService = getAIService();
      const aiResult = await aiService.evaluateResponse({
        questionText: question.questionText,
        questionType: question.questionType,
        cognitiveLevel: question.cognitiveLevel,
        referenceAnswer: question.referenceAnswer,
        rubric: question.rubric,
        studentResponse: data.response,
        competencyTitle: question.competencyNode.title,
        misconceptionTargeted: question.misconceptionTargeted ?? undefined,
      });

      // Save AI feedback (append-only)
      const feedback = await db.evaluationFeedback.create({
        data: {
          attemptId: attempt.id,
          strengths: aiResult.strengths,
          gaps: aiResult.gaps,
          misconceptionsFound: aiResult.misconceptionsFound,
          suggestedRemediation: aiResult.suggestedRemediation,
          feedbackSource: "AI_FIRST_PASS",
          aiModelVersion: aiResult.modelVersion,
          aiPromptVersion: aiResult.promptVersion,
        },
      });

      // Update attempt evaluation status
      await db.attempt.update({
        where: { id: attempt.id },
        data: {
          evaluationStatus: "AI_EVALUATED",
          scoreRaw: aiResult.scoreRaw,
          isCorrect: aiResult.scoreRaw >= 0.7,
        },
      });

      // Record mastery evidence from AI evaluation (flagged for mentor review)
      const quality = scoreToQuality(aiResult.scoreRaw, question.cognitiveLevel);
      await db.masteryEvidence.create({
        data: {
          studentId: studentProfile.id,
          competencyNodeId: question.competencyNodeId,
          evidenceType: "ASSESSMENT_ATTEMPT",
          attemptId: attempt.id,
          cognitiveLevel: question.cognitiveLevel,
          quality,
          notes: "AI_FIRST_PASS — pending mentor review",
        },
      });

      aiFeedback = {
        strengths: feedback.strengths,
        gaps: feedback.gaps,
        suggestedRemediation: feedback.suggestedRemediation,
        scoreRaw: aiResult.scoreRaw,
        source: "AI_FIRST_PASS",
        pendingMentorReview: true,
      };
    } catch (aiErr) {
      console.error("AI evaluation failed:", aiErr);
      // Don't fail the attempt submission — queue for mentor review
      await db.attempt.update({
        where: { id: attempt.id },
        data: { evaluationStatus: "PENDING_MENTOR" },
      });
    }
  }

  // Recompute mastery state snapshot for this competency
  await recomputeMasteryState(studentProfile.id, question.competencyNodeId);

  return apiResponse({
    attemptId: attempt.id,
    isCorrect: attempt.isCorrect,
    scoreRaw: attempt.scoreRaw,
    feedback: aiFeedback,
    // For MCQ: reveal correct answer after submission
    correctAnswer: scored
      ? {
          correctId: question.correctAnswer,
          explanation: question.explanation,
        }
      : null,
  });
});

// Recompute MasteryState from all historical evidence
async function recomputeMasteryState(studentId: string, competencyNodeId: string) {
  const { computeMasteryScores } = await import("@/domain/mastery/evidence");

  const evidence = await db.masteryEvidence.findMany({
    where: { studentId, competencyNodeId },
    orderBy: { recordedAt: "asc" },
  });

  const scores = computeMasteryScores(evidence);

  await db.masteryState.upsert({
    where: { studentId_competencyNodeId: { studentId, competencyNodeId } },
    update: {
      ...scores,
      evidenceCount: evidence.length,
      lastEvidenceAt: evidence.at(-1)?.recordedAt,
      computedAt: new Date(),
    },
    create: {
      studentId,
      competencyNodeId,
      ...scores,
      evidenceCount: evidence.length,
      lastEvidenceAt: evidence.at(-1)?.recordedAt,
    },
  });
}
