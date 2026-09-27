import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { ok, ForbiddenError } from "@cs-platform/shared";

const router = Router();
const db = new PrismaClient();

router.get("/", async (req, res, next) => {
  try {
    const role = req.headers["x-user-role"] as string;
    const userId = req.headers["x-user-id"] as string;
    if (!["MENTOR", "ADMIN"].includes(role)) throw new ForbiddenError();

    const where = role === "ADMIN" ? {} : { mentorUserId: userId };
    const interventions = await db.intervention.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        competencyNode: { select: { title: true, subject: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    ok(res, { interventions });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const role = req.headers["x-user-role"] as string;
    const userId = req.headers["x-user-id"] as string;
    if (!["MENTOR", "ADMIN"].includes(role)) throw new ForbiddenError();

    const body = z.object({
      studentProfileId: z.string(),
      competencyNodeId: z.string(),
      type: z.enum(["TARGETED_PRACTICE","CONCEPT_REVIEW","MENTOR_SESSION","REASSESSMENT"]),
      notes: z.string().optional(),
    }).parse(req.body);

    const intervention = await db.intervention.create({
      data: { ...body, mentorUserId: userId, status: "PENDING" },
    });
    ok(res, { intervention }, 201);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const role = req.headers["x-user-role"] as string;
    if (!["MENTOR", "ADMIN"].includes(role)) throw new ForbiddenError();

    const { status } = z.object({ status: z.enum(["PENDING","IN_PROGRESS","COMPLETED","CANCELLED"]) }).parse(req.body);
    const intervention = await db.intervention.update({
      where: { id: req.params.id },
      data: { status, ...(status === "COMPLETED" ? { completedAt: new Date() } : {}) },
    });
    ok(res, { intervention });
  } catch (err) { next(err); }
});

export default router;
