import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { withErrorHandler, apiResponse, parseBody } from "@/lib/validation";
import { NotFoundError } from "@/lib/errors";

const UpdateCohortSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const GET = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;

  const cohort = await db.cohort.findUnique({
    where: { id },
    include: {
      mentor: { include: { user: { select: { id: true, name: true, email: true } } } },
      students: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { attempts: true } },
        },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });

  if (!cohort) throw new NotFoundError("Cohort");
  return apiResponse({ cohort });
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  const body = await parseBody(req, UpdateCohortSchema);

  const existing = await db.cohort.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Cohort");

  const cohort = await db.cohort.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
      ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
    },
  });

  return apiResponse({ cohort });
});
