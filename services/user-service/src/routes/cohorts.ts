import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { ok, NotFoundError, ForbiddenError } from "@cs-platform/shared";

const router = Router();
const db = new PrismaClient();

function requireAdmin(req: { headers: Record<string, string | string[] | undefined> }) {
  if (req.headers["x-user-role"] !== "ADMIN") throw new ForbiddenError("Admin only");
}

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  mentorUserId: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET /api/admin/cohorts
router.get("/", async (req, res, next) => {
  try {
    requireAdmin(req);
    const cohorts = await db.cohort.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        mentor: { include: { user: { select: { name: true, email: true } } } },
        _count: { select: { students: true } },
      },
    });
    ok(res, { cohorts });
  } catch (err) { next(err); }
});

// POST /api/admin/cohorts
router.post("/", async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = CreateSchema.parse(req.body);
    let mentorProfile = await db.mentorProfile.findUnique({ where: { userId: body.mentorUserId } });
    if (!mentorProfile) {
      mentorProfile = await db.mentorProfile.create({ data: { userId: body.mentorUserId } });
    }
    const cohort = await db.cohort.create({
      data: {
        name: body.name,
        description: body.description,
        mentorId: mentorProfile.id,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
      include: { mentor: { include: { user: { select: { name: true } } } }, _count: { select: { students: true } } },
    });
    ok(res, { cohort }, 201);
  } catch (err) { next(err); }
});

// GET /api/admin/cohorts/:id
router.get("/:id", async (req, res, next) => {
  try {
    requireAdmin(req);
    const cohort = await db.cohort.findUnique({
      where: { id: req.params.id },
      include: {
        mentor: { include: { user: { select: { id: true, name: true, email: true } } } },
        students: {
          include: { user: { select: { id: true, name: true, email: true } }, _count: { select: { attempts: true } } },
          orderBy: { enrolledAt: "desc" },
        },
      },
    });
    if (!cohort) throw new NotFoundError("Cohort");
    ok(res, { cohort });
  } catch (err) { next(err); }
});

// PATCH /api/admin/cohorts/:id
router.patch("/:id", async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = UpdateSchema.parse(req.body);
    const cohort = await db.cohort.update({
      where: { id: req.params.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
      },
    });
    ok(res, { cohort });
  } catch (err) { next(err); }
});

// POST /api/admin/cohorts/:id/students
router.post("/:id/students", async (req, res, next) => {
  try {
    requireAdmin(req);
    const { userId } = z.object({ userId: z.string() }).parse(req.body);
    const profile = await db.studentProfile.upsert({
      where: { userId },
      update: { cohortId: req.params.id },
      create: { userId, cohortId: req.params.id },
    });
    ok(res, { profile });
  } catch (err) { next(err); }
});

// DELETE /api/admin/cohorts/:id/students
router.delete("/:id/students", async (req, res, next) => {
  try {
    requireAdmin(req);
    const { studentProfileId } = z.object({ studentProfileId: z.string() }).parse(req.body);
    await db.studentProfile.update({ where: { id: studentProfileId }, data: { cohortId: null } });
    ok(res, { ok: true });
  } catch (err) { next(err); }
});

export default router;
