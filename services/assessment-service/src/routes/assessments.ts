import { Router } from "express";
import { z } from "zod";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { ok, NotFoundError, ForbiddenError } from "@cs-platform/shared";

const router = Router();
const db = new PrismaClient();

const AI_URL = process.env.AI_SERVICE_URL ?? "http://localhost:4007";
const MASTERY_URL = process.env.MASTERY_SERVICE_URL ?? "http://localhost:4006";

async function getOrCreateStudentProfile(userId: string) {
  let profile = await db.studentProfile.findUnique({ where: { userId } });
  if (!profile) profile = await db.studentProfile.create({ data: { userId } });
  return profile;
}

// GET /api/assessments — student's own assessments
router.get("/", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const profile = await getOrCreateStudentProfile(userId);
    const assessments = await db.assessment.findMany({
      where: { studentId: profile.id },
      include: {
        nodes: { include: { competencyNode: { select: { title: true, subject: true } } } },
        _count: { select: { attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    ok(res, { assessments });
  } catch (err) { next(err); }
});

// POST /api/assessments — start a new assessment
router.post("/", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const body = z.object({
      nodeIds: z.array(z.string()).min(1),
      type: z.enum(["SELF_ASSESSMENT", "MENTOR_ASSIGNED", "REASSESSMENT"]).default("SELF_ASSESSMENT"),
    }).parse(req.body);

    const profile = await getOrCreateStudentProfile(userId);
    const assessment = await db.assessment.create({
      data: {
        studentId: profile.id,
        type: body.type,
        status: "IN_PROGRESS",
        nodes: { create: body.nodeIds.map((competencyNodeId, i) => ({ competencyNodeId, orderIndex: i })) },
      },
      include: { nodes: { include: { competencyNode: true } } },
    });
    ok(res, { assessment }, 201);
  } catch (err) { next(err); }
});

// GET /api/assessments/:id
router.get("/:id", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;
    const profile = await getOrCreateStudentProfile(userId);

    const assessment = await db.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        nodes: { include: { competencyNode: true } },
        attempts: {
          include: { question: { include: { options: true } }, evaluationFeedback: { orderBy: { createdAt: "desc" }, take: 1 } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!assessment) throw new NotFoundError("Assessment");
    if (assessment.studentId !== profile.id && !["MENTOR", "ADMIN"].includes(role)) throw new ForbiddenError();
    ok(res, { assessment });
  } catch (err) { next(err); }
});

// POST /api/assessments/:id/attempts — submit an answer
router.post("/:id/attempts", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const body = z.object({
      questionId: z.string(),
      responseText: z.string().optional(),
      selectedOptionIds: z.array(z.string()).optional(),
    }).parse(req.body);

    const profile = await getOrCreateStudentProfile(userId);
    const assessment = await db.assessment.findUnique({ where: { id: req.params.id } });
    if (!assessment || assessment.studentId !== profile.id) throw new ForbiddenError();

    const question = await db.question.findUnique({ where: { id: body.questionId }, include: { options: true } });
    if (!question) throw new NotFoundError("Question");

    // Auto-score MCQ
    let scoreRaw: number | null = null;
    if (question.type === "MCQ" || question.type === "MULTI_SELECT") {
      const correctIds = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.id));
      const selectedIds = new Set(body.selectedOptionIds ?? []);
      const correct = [...correctIds].every((id) => selectedIds.has(id)) && [...selectedIds].every((id) => correctIds.has(id));
      scoreRaw = correct ? 1.0 : 0.0;
    }

    const attempt = await db.attempt.create({
      data: {
        assessmentId: req.params.id,
        studentId: profile.id,
        questionId: body.questionId,
        responseText: body.responseText,
        selectedOptionIds: body.selectedOptionIds ?? [],
        scoreRaw,
        scoredAt: scoreRaw !== null ? new Date() : undefined,
      },
    });

    // AI evaluation for open-ended
    if (scoreRaw === null && body.responseText) {
      try {
        const { data } = await axios.post(`${AI_URL}/api/ai/evaluate`, {
          question: question.stem,
          studentAnswer: body.responseText,
          evaluationHint: question.rubric,
          cognitiveLevel: question.cognitiveLevel,
        });
        const result = data.data;
        scoreRaw = result.scoreRaw ?? 0.3;

        await db.attempt.update({ where: { id: attempt.id }, data: { scoreRaw, scoredAt: new Date() } });
        await db.evaluationFeedback.create({
          data: {
            attemptId: attempt.id,
            strengths: result.strengths ?? [],
            gaps: result.gaps ?? [],
            misconceptionsFound: result.misconceptionsFound ?? [],
            suggestedRemediation: result.suggestedRemediation ?? "",
            feedbackSource: "AI_FIRST_PASS",
            scoreAdjusted: scoreRaw,
          },
        });

        // Record mastery evidence
        await axios.post(`${MASTERY_URL}/api/mastery/evidence`, {
          studentProfileId: profile.id,
          competencyNodeId: question.competencyNodeId,
          cognitiveLevel: question.cognitiveLevel,
          evidenceType: "ATTEMPT",
          sourceId: attempt.id,
          scoreRaw,
        }).catch(() => {});
      } catch { /* non-blocking */ }
    }

    ok(res, { attempt }, 201);
  } catch (err) { next(err); }
});

export default router;
