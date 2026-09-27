import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { ok, NotFoundError, ForbiddenError } from "@cs-platform/shared";

const router = Router();
const db = new PrismaClient();

// GET /api/users?role=STUDENT  — admin only
router.get("/", async (req, res, next) => {
  try {
    const role = req.headers["x-user-role"] as string;
    if (!["MENTOR", "ADMIN"].includes(role)) throw new ForbiddenError();
    const roleFilter = req.query.role as string | undefined;
    const users = await db.user.findMany({
      where: { isActive: true, ...(roleFilter ? { role: roleFilter as never } : {}) },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
    ok(res, { users });
  } catch (err) { next(err); }
});

// GET /api/users/:id — own profile or admin
router.get("/:id", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;
    if (req.params.id !== userId && role !== "ADMIN") throw new ForbiddenError();

    const user = await db.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!user) throw new NotFoundError("User");

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: req.params.id },
      include: { cohort: { select: { id: true, name: true } } },
    });
    const mentorProfile = await db.mentorProfile.findUnique({
      where: { userId: req.params.id },
    });

    ok(res, { user, studentProfile, mentorProfile });
  } catch (err) { next(err); }
});

export default router;
