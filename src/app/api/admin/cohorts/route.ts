import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { withErrorHandler, apiResponse, parseBody } from "@/lib/validation";

const CreateCohortSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  mentorUserId: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const GET = withErrorHandler(async (_req: NextRequest) => {
  await requireAdmin();

  const cohorts = await db.cohort.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      mentor: {
        include: { user: { select: { name: true, email: true } } },
      },
      _count: { select: { students: true } },
    },
  });

  return apiResponse({ cohorts });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await parseBody(req, CreateCohortSchema);

  // Ensure mentor profile exists
  let mentorProfile = await db.mentorProfile.findUnique({
    where: { userId: body.mentorUserId },
  });
  if (!mentorProfile) {
    // Auto-create mentor profile for this user
    mentorProfile = await db.mentorProfile.create({
      data: { userId: body.mentorUserId },
    });
  }

  const cohort = await db.cohort.create({
    data: {
      name: body.name,
      description: body.description,
      mentorId: mentorProfile.id,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    },
    include: {
      mentor: { include: { user: { select: { name: true } } } },
      _count: { select: { students: true } },
    },
  });

  return apiResponse({ cohort }, 201);
});
