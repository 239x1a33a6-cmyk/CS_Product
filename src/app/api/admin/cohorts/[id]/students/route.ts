import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { withErrorHandler, apiResponse, parseBody } from "@/lib/validation";
import { NotFoundError, ValidationError } from "@/lib/errors";

const AddStudentSchema = z.object({
  userId: z.string().min(1),
});

const RemoveStudentSchema = z.object({
  studentProfileId: z.string().min(1),
});

// POST: add a student user to this cohort (creates StudentProfile if needed)
export const POST = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  const body = await parseBody(req, AddStudentSchema);

  const cohort = await db.cohort.findUnique({ where: { id } });
  if (!cohort) throw new NotFoundError("Cohort");

  const user = await db.user.findUnique({ where: { id: body.userId } });
  if (!user) throw new NotFoundError("User");
  if (user.role !== "STUDENT") throw new ValidationError("User must have STUDENT role");

  // Upsert StudentProfile and assign to cohort
  const studentProfile = await db.studentProfile.upsert({
    where: { userId: body.userId },
    update: { cohortId: id },
    create: { userId: body.userId, cohortId: id },
  });

  return apiResponse({ studentProfile }, 201);
});

// DELETE: remove a student from this cohort (un-assign, don't delete)
export const DELETE = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  const body = await parseBody(req, RemoveStudentSchema);

  const profile = await db.studentProfile.findUnique({
    where: { id: body.studentProfileId },
  });
  if (!profile) throw new NotFoundError("StudentProfile");
  if (profile.cohortId !== id) throw new ValidationError("Student is not in this cohort");

  await db.studentProfile.update({
    where: { id: body.studentProfileId },
    data: { cohortId: null },
  });

  return apiResponse({ removed: true });
});
