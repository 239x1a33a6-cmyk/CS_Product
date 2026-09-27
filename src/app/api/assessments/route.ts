import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireStudent } from "@/lib/auth/session";
import { withErrorHandler, apiResponse } from "@/lib/validation";
import { NotFoundError } from "@/lib/errors";

const createSchema = z.object({
  type: z.enum(["DIAGNOSTIC", "PRACTICE", "CHECKPOINT", "REASSESSMENT"]),
  competencyNodeIds: z.array(z.string()).min(1).max(10),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireStudent();
  const body = await req.json();
  const data = createSchema.parse(body);

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!studentProfile) throw new NotFoundError("StudentProfile");

  // Verify all competency nodes exist
  const nodes = await db.competencyNode.findMany({
    where: { id: { in: data.competencyNodeIds }, isActive: true },
    select: { id: true, title: true },
  });
  if (nodes.length !== data.competencyNodeIds.length) {
    throw new NotFoundError("One or more competency nodes");
  }

  const assessment = await db.assessment.create({
    data: {
      type: data.type,
      studentId: studentProfile.id,
      status: "PENDING",
      competencyNodes: {
        create: data.competencyNodeIds.map((nodeId) => ({
          competencyNodeId: nodeId,
        })),
      },
    },
    include: {
      competencyNodes: {
        include: { competencyNode: { select: { id: true, title: true } } },
      },
    },
  });

  return apiResponse({ assessment }, 201);
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await requireStudent();
  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!studentProfile) throw new NotFoundError("StudentProfile");

  const assessments = await db.assessment.findMany({
    where: { studentId: studentProfile.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      competencyNodes: {
        include: { competencyNode: { select: { id: true, title: true } } },
      },
      _count: { select: { attempts: true } },
    },
  });

  return apiResponse({ assessments });
});
