import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireStudent } from "@/lib/auth/session";
import { withErrorHandler, apiResponse, parseBody } from "@/lib/validation";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import type { ScriptGraph } from "@/domain/interview/types";

const StartSessionSchema = z.object({
  scriptId: z.string().min(1),
});

// GET: list available scripts and student's session history
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const session = await requireStudent();

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!studentProfile) throw new NotFoundError("StudentProfile");

  const [scripts, sessions] = await Promise.all([
    db.interviewScript.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        competencyNode: { select: { title: true, subject: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.interviewSession.findMany({
      where: { studentId: studentProfile.id },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        script: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return apiResponse({ scripts, sessions });
});

// POST: start a new interview session
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireStudent();
  const body = await parseBody(req, StartSessionSchema);

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!studentProfile) throw new NotFoundError("StudentProfile");

  const script = await db.interviewScript.findUnique({
    where: { id: body.scriptId },
  });
  if (!script) throw new NotFoundError("InterviewScript");
  if (!script.isActive) throw new ForbiddenError("This interview is not currently available");

  // Validate graph has a valid start
  const graph = script.scriptGraph as unknown as ScriptGraph;
  if (!graph.nodes[graph.startNodeId]) {
    throw new Error("Script graph is misconfigured");
  }

  const interviewSession = await db.interviewSession.create({
    data: {
      scriptId: script.id,
      studentId: studentProfile.id,
      type: "SCRIPTED",
      status: "IN_PROGRESS",
      startedAt: new Date(),
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
      script: { select: { id: true, title: true } },
    },
  });

  return apiResponse({ session: interviewSession }, 201);
});
