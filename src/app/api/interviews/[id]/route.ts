import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { requireStudent } from "@/lib/auth/session";
import { withErrorHandler, apiResponse } from "@/lib/validation";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import type { ScriptGraph } from "@/domain/interview/types";
import { deriveCurrentNodeId } from "@/domain/interview/session";

export const GET = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  const authSession = await requireStudent();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: authSession.user.id },
  });
  if (!studentProfile) throw new NotFoundError("StudentProfile");

  const session = await db.interviewSession.findUnique({
    where: { id },
    include: {
      script: true,
      turns: {
        orderBy: { turnIndex: "asc" },
        select: {
          id: true,
          turnIndex: true,
          questionText: true,
          studentResponse: true,
          scoreRaw: true,
          evaluationNotes: true,
          followUpTrigger: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) throw new NotFoundError("InterviewSession");
  if (session.studentId !== studentProfile.id) throw new ForbiddenError();
  if (!session.script) throw new NotFoundError("InterviewScript");

  const graph = session.script.scriptGraph as unknown as ScriptGraph;
  const currentNodeId = deriveCurrentNodeId(graph, session.turns);
  const currentNode = currentNodeId ? graph.nodes[currentNodeId] ?? null : null;

  return apiResponse({
    session: {
      id: session.id,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      scriptTitle: session.script.title,
    },
    currentQuestion: currentNode
      ? {
          id: currentNode.id,
          questionText: currentNode.questionText,
          estimatedMinutes: currentNode.estimatedMinutes,
        }
      : null,
    turns: session.turns,
    totalNodes: Object.keys(graph.nodes).length,
  });
});
