import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { withErrorHandler, apiResponse, parseBody } from "@/lib/validation";
import { NotFoundError } from "@/lib/errors";

const ScriptBranchSchema = z.object({
  condition: z.enum(["STRONG", "PARTIAL", "WEAK"]),
  nextNodeId: z.string().nullable(),
  label: z.string().min(1),
});

const ScriptNodeSchema = z.object({
  id: z.string().min(1),
  questionText: z.string().min(1),
  evaluationHint: z.string().min(1),
  competencyNodeId: z.string().nullable().optional(),
  estimatedMinutes: z.number().optional(),
  branches: z.array(ScriptBranchSchema),
});

const ScriptGraphSchema = z.object({
  startNodeId: z.string().min(1),
  nodes: z.record(ScriptNodeSchema),
});

const UpdateScriptSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  competencyNodeId: z.string().optional(),
  scriptGraph: ScriptGraphSchema.optional(),
  isActive: z.boolean().optional(),
});

export const GET = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;

  const script = await db.interviewScript.findUnique({
    where: { id },
    include: {
      competencyNode: { select: { id: true, title: true, subject: true } },
      _count: { select: { sessions: true } },
    },
  });

  if (!script) throw new NotFoundError("InterviewScript");
  return apiResponse({ script });
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  const body = await parseBody(req, UpdateScriptSchema);

  const existing = await db.interviewScript.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("InterviewScript");

  const script = await db.interviewScript.update({
    where: { id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.competencyNodeId && { competencyNodeId: body.competencyNodeId }),
      ...(body.scriptGraph && { scriptGraph: body.scriptGraph, version: { increment: 1 } }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return apiResponse({ script });
});

export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;

  const existing = await db.interviewScript.findUnique({
    where: { id },
    include: { _count: { select: { sessions: true } } },
  });
  if (!existing) throw new NotFoundError("InterviewScript");

  if (existing._count.sessions > 0) {
    await db.interviewScript.update({ where: { id }, data: { isActive: false } });
    return apiResponse({ deactivated: true });
  }

  await db.interviewScript.delete({ where: { id } });
  return apiResponse({ deleted: true });
});
