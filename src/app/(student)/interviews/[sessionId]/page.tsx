import { auth } from "@/lib/auth/config";
import { db } from "@/db/client";
import { notFound, redirect } from "next/navigation";
import { InterviewSession } from "./InterviewSession";
import type { ScriptGraph } from "@/domain/interview/types";
import { deriveCurrentNodeId } from "@/domain/interview/session";

export default async function InterviewSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const authSession = await auth();
  const { sessionId } = await params;

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: authSession!.user.id },
  });

  if (!studentProfile) redirect("/dashboard");

  const session = await db.interviewSession.findUnique({
    where: { id: sessionId },
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
        },
      },
    },
  });

  if (!session) notFound();
  if (session.studentId !== studentProfile.id) redirect("/interviews");
  if (!session.script) notFound();

  const graph = session.script.scriptGraph as unknown as ScriptGraph;
  const currentNodeId = deriveCurrentNodeId(graph, session.turns);
  const currentNode = currentNodeId ? graph.nodes[currentNodeId] ?? null : null;

  return (
    <InterviewSession
      sessionId={session.id}
      scriptTitle={session.script.title}
      status={session.status}
      initialTurns={session.turns.map((t) => ({
        id: t.id,
        turnIndex: t.turnIndex,
        questionText: t.questionText,
        studentResponse: t.studentResponse ?? "",
        scoreRaw: t.scoreRaw ?? null,
        evaluationNotes: t.evaluationNotes,
        branchCondition: t.followUpTrigger,
      }))}
      currentQuestion={currentNode
        ? {
            id: currentNode.id,
            questionText: currentNode.questionText,
            estimatedMinutes: currentNode.estimatedMinutes,
          }
        : null}
      totalNodes={Object.keys(graph.nodes).length}
    />
  );
}
