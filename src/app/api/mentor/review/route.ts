import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireMentor } from "@/lib/auth/session";
import { withErrorHandler, apiResponse } from "@/lib/validation";
import { NotFoundError } from "@/lib/errors";
import { scoreToQuality } from "@/domain/mastery/evidence";

// GET: list attempts pending mentor review
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireMentor();
  const studentId = req.nextUrl.searchParams.get("studentId");

  const attempts = await db.attempt.findMany({
    where: {
      evaluationStatus: { in: ["AI_EVALUATED", "PENDING_MENTOR"] },
      ...(studentId ? { studentId } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 50,
    include: {
      question: {
        select: {
          id: true,
          questionText: true,
          questionType: true,
          cognitiveLevel: true,
          referenceAnswer: true,
          rubric: true,
          competencyNode: { select: { id: true, title: true } },
        },
      },
      student: {
        include: { user: { select: { name: true, email: true } } },
      },
      evaluationFeedback: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return apiResponse({ attempts });
});

const reviewSchema = z.object({
  attemptId: z.string(),
  scoreRaw: z.number().min(0).max(1),
  strengths: z.string().optional(),
  gaps: z.string().optional(),
  misconceptionsFound: z.array(z.string()).optional(),
  suggestedRemediation: z.string().optional(),
});

// POST: mentor submits/overrides evaluation
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireMentor();
  const body = await req.json();
  const data = reviewSchema.parse(body);

  const attempt = await db.attempt.findUnique({
    where: { id: data.attemptId },
    include: { question: { select: { cognitiveLevel: true, competencyNodeId: true } } },
  });
  if (!attempt) throw new NotFoundError("Attempt");

  // Record mentor feedback (append-only)
  await db.evaluationFeedback.create({
    data: {
      attemptId: data.attemptId,
      strengths: data.strengths,
      gaps: data.gaps,
      misconceptionsFound: data.misconceptionsFound ?? [],
      suggestedRemediation: data.suggestedRemediation,
      scoreAdjusted: data.scoreRaw,
      feedbackSource: "MENTOR_REVIEWED",
      reviewedByMentorId: session.user.id,
      reviewedAt: new Date(),
    },
  });

  // Update attempt with mentor's final score
  await db.attempt.update({
    where: { id: data.attemptId },
    data: {
      evaluationStatus: "MENTOR_REVIEWED",
      scoreRaw: data.scoreRaw,
      isCorrect: data.scoreRaw >= 0.7,
    },
  });

  // Add authoritative mastery evidence (mentor-reviewed)
  const quality = scoreToQuality(data.scoreRaw, attempt.question.cognitiveLevel);
  await db.masteryEvidence.create({
    data: {
      studentId: attempt.studentId,
      competencyNodeId: attempt.question.competencyNodeId,
      evidenceType: "ASSESSMENT_ATTEMPT",
      attemptId: attempt.id,
      cognitiveLevel: attempt.question.cognitiveLevel,
      quality,
      notes: `Mentor reviewed by ${session.user.id}`,
    },
  });

  // Recompute mastery state
  const { computeMasteryScores } = await import("@/domain/mastery/evidence");
  const evidence = await db.masteryEvidence.findMany({
    where: {
      studentId: attempt.studentId,
      competencyNodeId: attempt.question.competencyNodeId,
    },
  });
  const scores = computeMasteryScores(evidence);
  await db.masteryState.upsert({
    where: {
      studentId_competencyNodeId: {
        studentId: attempt.studentId,
        competencyNodeId: attempt.question.competencyNodeId,
      },
    },
    update: { ...scores, evidenceCount: evidence.length, computedAt: new Date() },
    create: {
      studentId: attempt.studentId,
      competencyNodeId: attempt.question.competencyNodeId,
      ...scores,
      evidenceCount: evidence.length,
    },
  });

  return apiResponse({ success: true });
});
