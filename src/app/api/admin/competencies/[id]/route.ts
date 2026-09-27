import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { withErrorHandler, parseBody, apiResponse } from "@/lib/validation";
import { NotFoundError } from "@/lib/errors";

const UpdateSchema = z.object({
  subject: z
    .enum([
      "OPERATING_SYSTEMS",
      "DBMS",
      "SQL",
      "COMPUTER_NETWORKS",
      "OOP",
      "SOFTWARE_ENGINEERING",
      "COMPUTER_ARCHITECTURE",
      "ALGORITHMS",
      "DATA_STRUCTURES",
    ])
    .optional(),
  domain: z.string().min(1).optional(),
  skill: z.string().min(1).optional(),
  subSkill: z.string().nullable().optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  learningObjective: z.string().min(1).optional(),
  difficulty: z.enum(["FOUNDATIONAL", "INTERMEDIATE", "ADVANCED"]).optional(),
  misconceptions: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const GET = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;

  const node = await db.competencyNode.findUnique({
    where: { id },
    include: {
      _count: { select: { questions: true, masteryStates: true, interviewScripts: true } },
    },
  });
  if (!node) throw new NotFoundError("Competency node not found");

  return apiResponse({ node });
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  const body = await parseBody(req, UpdateSchema);

  const existing = await db.competencyNode.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Competency node not found");

  const node = await db.competencyNode.update({
    where: { id },
    data: { ...body, version: { increment: 1 } },
  });

  return apiResponse({ node });
});
