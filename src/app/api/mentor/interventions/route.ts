import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireMentor } from "@/lib/auth/session";
import { withErrorHandler, apiResponse, parseBody, paginate } from "@/lib/validation";
import { NotFoundError } from "@/lib/errors";

const UpdateStatusSchema = z.object({
  interventionId: z.string().min(1),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await requireMentor();
  const { skip, take } = paginate(req.nextUrl.searchParams);
  const isAdmin = session.user.role === "ADMIN";

  const interventions = await db.intervention.findMany({
    where: isAdmin ? {} : { mentorId: session.user.id },
    skip,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        include: { user: { select: { name: true, email: true } } },
      },
      competencyNode: { select: { id: true, title: true, subject: true } },
      mentor: { select: { name: true } },
    },
  });

  const total = await db.intervention.count({
    where: isAdmin ? {} : { mentorId: session.user.id },
  });

  return apiResponse({ interventions, total });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const session = await requireMentor();
  const body = await parseBody(req, UpdateStatusSchema);

  const intervention = await db.intervention.findUnique({
    where: { id: body.interventionId },
  });
  if (!intervention) throw new NotFoundError("Intervention");

  // Only the creating mentor or admin can update
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && intervention.mentorId !== session.user.id) {
    throw new NotFoundError("Intervention");
  }

  const updated = await db.intervention.update({
    where: { id: body.interventionId },
    data: { status: body.status },
  });

  return apiResponse({ intervention: updated });
});
