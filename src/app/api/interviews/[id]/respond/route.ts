import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireStudent } from "@/lib/auth/session";
import { withErrorHandler, apiResponse, parseBody } from "@/lib/validation";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import { AnthropicAdapter } from "@/ai/AnthropicAdapter";
import type { ScriptGraph } from "@/domain/interview/types";
import { scoreToBranchCondition } from "@/domain/interview/types";
import { deriveCurrentNodeId } from "@/domain/interview/session";

const RespondSchema = z.object({
  response: z.string().min(1).max(8000),
});

const ai = new AnthropicAdapter();

export const POST = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  const authSession = await requireStudent();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  const body = await parseBody(req, RespondSchema);

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
        select: { turnIndex: true, followUpTrigger: true },
      },
    },
  });

  if (!session) throw new NotFoundError("InterviewSession");
  if (session.studentId !== studentProfile.id) throw new ForbiddenError();
  if (session.status !== "IN_PROGRESS") {
    throw new ValidationError("Session is not in progress");
  }
  if (!session.script) throw new NotFoundError("InterviewScript");

  const graph = session.script.scriptGraph as unknown as ScriptGraph;
  const currentNodeId = deriveCurrentNodeId(graph, session.turns);
  if (!currentNodeId) throw new ValidationError("No active question in this session");

  const currentNode = graph.nodes[currentNodeId];
  if (!currentNode) throw new NotFoundError("Script node");

  const nextTurnIndex = session.turns.length;

  // AI evaluation
  let scoreRaw = 0.5;
  let evaluationNotes = "";
  let branchCondition = scoreToBranchCondition(scoreRaw);

  try {
    const result = await ai.evaluateResponse({
      questionText: currentNode.questionText,
      questionType: "EXPLAIN",
      cognitiveLevel: "UNDERSTANDING",
      referenceAnswer: currentNode.evaluationHint,
      studentResponse: body.response,
      competencyTitle: currentNode.evaluationHint.slice(0, 80) || "CS Fundamentals",
    });

    scoreRaw = result.scoreRaw;
    branchCondition = scoreToBranchCondition(scoreRaw);
    evaluationNotes = JSON.stringify({
      strengths: result.strengths,
      gaps: result.gaps,
      suggestedRemediation: result.suggestedRemediation,
    });
  } catch {
    branchCondition = "PARTIAL";
    evaluationNotes = JSON.stringify({ note: "AI evaluation unavailable. Mentor will review." });
  }

  // Determine next node
  const matchingBranch = currentNode.branches.find(
    (b) => b.condition === branchCondition
  );
  const nextNodeId = matchingBranch?.nextNodeId ?? null;
  const isComplete = nextNodeId === null;

  // Record turn and update session
  const [turn] = await db.$transaction([
    db.interviewTurn.create({
      data: {
        sessionId: session.id,
        turnIndex: nextTurnIndex,
        questionText: currentNode.questionText,
        studentResponse: body.response,
        scoreRaw,
        evaluationNotes,
        followUpTrigger: branchCondition,
      },
    }),
    db.interviewSession.update({
      where: { id: session.id },
      data: {
        status: isComplete ? "COMPLETED" : "IN_PROGRESS",
        completedAt: isComplete ? new Date() : null,
      },
    }),
  ]);

  // Parse feedback for response (don't expose raw evaluationHint)
  let parsedFeedback: { strengths?: string; gaps?: string; note?: string } = {};
  try {
    parsedFeedback = JSON.parse(evaluationNotes);
  } catch {
    parsedFeedback = {};
  }

  const nextNode = nextNodeId ? graph.nodes[nextNodeId] : null;

  return apiResponse({
    turn: {
      id: turn.id,
      turnIndex: turn.turnIndex,
      scoreRaw,
      feedback: parsedFeedback,
      branchCondition,
    },
    nextQuestion: nextNode
      ? {
          id: nextNode.id,
          questionText: nextNode.questionText,
          estimatedMinutes: nextNode.estimatedMinutes,
        }
      : null,
    isComplete,
  });
});
