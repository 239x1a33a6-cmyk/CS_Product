import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { ok, ForbiddenError } from "@cs-platform/shared";

const router = Router();
const db = new PrismaClient();

// GET /api/mentor/review — pending AI-scored attempts awaiting mentor review
router.get("/", async (req, res, next) => {
  try {
    const role = req.headers["x-user-role"] as string;
    if (!["MENTOR", "ADMIN"].includes(role)) throw new ForbiddenError();

    const attempts = await db.attempt.findMany({
      where: {
        scoreRaw: { not: null },
        evaluationFeedback: { none: { feedbackSource: "MENTOR_OVERRIDE" } },
        question: { type: { notIn: ["MCQ", "MULTI_SELECT"] } },
      },
      include: {
        question: { select: { stem: true, cognitiveLevel: true, type: true } },
        student: { include: { user: { select: { name: true, email: true } } } },
        evaluationFeedback: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    ok(res, { attempts });
  } catch (err) { next(err); }
});

// POST /api/mentor/review — mentor override
router.post("/", async (req, res, next) => {
  try {
    const role = req.headers["x-user-role"] as string;
    if (!["MENTOR", "ADMIN"].includes(role)) throw new ForbiddenError();

    const body = z.object({
      attemptId: z.string(),
      scoreAdjusted: z.number().min(0).max(1),
      strengths: z.array(z.string()).default([]),
      gaps: z.array(z.string()).default([]),
      suggestedRemediation: z.string().optional(),
    }).parse(req.body);

    const feedback = await db.evaluationFeedback.create({
      data: { ...body, feedbackSource: "MENTOR_OVERRIDE", misconceptionsFound: [] },
    });
    ok(res, { feedback }, 201);
  } catch (err) { next(err); }
});

export default router;
