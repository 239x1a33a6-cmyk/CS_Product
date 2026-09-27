import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { ok, ForbiddenError } from "@cs-platform/shared";

const router = Router();
const db = new PrismaClient();

const HALF_LIFE_DAYS = 30;

function decay(score: number, daysAgo: number): number {
  return score * Math.pow(0.5, daysAgo / HALF_LIFE_DAYS);
}

// POST /api/mastery/evidence — called internally by other services
router.post("/evidence", async (req, res, next) => {
  try {
    const body = z.object({
      studentProfileId: z.string(),
      competencyNodeId: z.string(),
      cognitiveLevel: z.enum(["RECALL","UNDERSTANDING","APPLICATION","REASONING","DEFENSIBILITY"]),
      evidenceType: z.enum(["ATTEMPT","INTERVIEW_TURN","MENTOR_OVERRIDE","SYSTEM_INFERRED"]),
      sourceId: z.string(),
      scoreRaw: z.number().min(0).max(1),
      notes: z.string().optional(),
    }).parse(req.body);

    await db.masteryEvidence.create({ data: body });

    // Recompute mastery state for this node+level
    const allEvidence = await db.masteryEvidence.findMany({
      where: { studentProfileId: body.studentProfileId, competencyNodeId: body.competencyNodeId, cognitiveLevel: body.cognitiveLevel },
      orderBy: { createdAt: "desc" },
    });

    const now = Date.now();
    let weightedSum = 0, weightSum = 0;
    for (const e of allEvidence) {
      const daysAgo = (now - e.createdAt.getTime()) / 86400000;
      const weight = Math.pow(0.5, daysAgo / HALF_LIFE_DAYS);
      weightedSum += (e.scoreRaw ?? 0) * weight;
      weightSum += weight;
    }
    const score = weightSum > 0 ? weightedSum / weightSum : null;

    await db.masteryState.upsert({
      where: { studentId_nodeId_level: { studentId: body.studentProfileId, nodeId: body.competencyNodeId, level: body.cognitiveLevel } },
      update: { score, lastEvidenceAt: new Date(), evidenceCount: allEvidence.length },
      create: { studentId: body.studentProfileId, nodeId: body.competencyNodeId, level: body.cognitiveLevel, score, lastEvidenceAt: new Date(), evidenceCount: allEvidence.length },
    });

    ok(res, { ok: true });
  } catch (err) { next(err); }
});

// GET /api/mastery/:studentProfileId — mastery summary for a student
router.get("/:studentProfileId", async (req, res, next) => {
  try {
    const role = req.headers["x-user-role"] as string;
    const userId = req.headers["x-user-id"] as string;
    const profile = await db.studentProfile.findUnique({ where: { id: req.params.studentProfileId } });
    if (profile?.userId !== userId && !["MENTOR", "ADMIN"].includes(role)) throw new ForbiddenError();

    const states = await db.masteryState.findMany({
      where: { studentId: req.params.studentProfileId },
      include: { node: { select: { title: true, subject: true, domain: true } } },
      orderBy: [{ node: { subject: "asc" } }, { level: "asc" }],
    });
    ok(res, { states });
  } catch (err) { next(err); }
});

export default router;
