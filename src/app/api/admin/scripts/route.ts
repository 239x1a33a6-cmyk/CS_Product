import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { withErrorHandler, apiResponse, parseBody, paginate } from "@/lib/validation";
import type { ScriptGraph } from "@/domain/interview/types";

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

const CreateScriptSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  competencyNodeId: z.string().min(1),
  scriptGraph: ScriptGraphSchema,
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const { skip, take } = paginate(req.nextUrl.searchParams);

  const [scripts, total] = await Promise.all([
    db.interviewScript.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        isActive: true,
        version: true,
        createdAt: true,
        competencyNode: { select: { id: true, title: true, subject: true } },
        _count: { select: { sessions: true } },
      },
    }),
    db.interviewScript.count(),
  ]);

  return apiResponse({ scripts, total });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdmin();
  const body = await parseBody(req, CreateScriptSchema);

  // Validate graph integrity: startNodeId exists, all nextNodeIds exist or null
  const graph = body.scriptGraph as ScriptGraph;
  if (!graph.nodes[graph.startNodeId]) {
    throw new Error(`startNodeId "${graph.startNodeId}" not found in nodes`);
  }
  for (const node of Object.values(graph.nodes)) {
    for (const branch of node.branches) {
      if (branch.nextNodeId && !graph.nodes[branch.nextNodeId]) {
        throw new Error(`Branch nextNodeId "${branch.nextNodeId}" not found`);
      }
    }
  }

  // Verify competencyNode exists
  const competencyNode = await db.competencyNode.findUnique({
    where: { id: body.competencyNodeId },
  });
  if (!competencyNode) throw new Error("CompetencyNode not found");

  const script = await db.interviewScript.create({
    data: {
      title: body.title,
      description: body.description,
      competencyNodeId: body.competencyNodeId,
      authoredByUserId: session.user.id,
      scriptGraph: body.scriptGraph,
      isActive: false,
    },
  });

  return apiResponse({ script }, 201);
});
