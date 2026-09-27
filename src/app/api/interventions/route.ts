import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireMentor } from "@/lib/auth/session";
import { withErrorHandler, apiResponse } from "@/lib/validation";
import { NotFoundError } from "@/lib/errors";

const createSchema = z.object({
  studentProfileId: z.string(),
  competencyNodeId: z.string().optional(),
  type: z.enum(["REMEDIATION", "REASSESSMENT_REQUEST", "ADDITIONAL_PRACTICE", "NOTE", "MEETING"]),
  rationale: z.string().min(10).max(2000),
  description: z.string().min(10).max(2000),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireMentor();
  const body = await req.json();
  const data = createSchema.parse(body);

  const mentorProfile = await db.mentorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!mentorProfile) throw new NotFoundError("MentorProfile");

  const intervention = await db.intervention.create({
    data: {
      mentorId: session.user.id,
      mentorProfileId: mentorProfile.id,
      studentId: data.studentProfileId,
      competencyNodeId: data.competencyNodeId,
      type: data.type,
      rationale: data.rationale,
      description: data.description,
    },
  });

  return apiResponse({ intervention }, 201);
});

const updateSchema = z.object({
  id: z.string(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  outcomeNotes: z.string().optional(),
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  await requireMentor();
  const body = await req.json();
  const data = updateSchema.parse(body);

  const intervention = await db.intervention.update({
    where: { id: data.id },
    data: {
      status: data.status,
      outcomeNotes: data.outcomeNotes,
    },
  });

  return apiResponse({ intervention });
});
