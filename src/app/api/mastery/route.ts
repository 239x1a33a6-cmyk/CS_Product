import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { requireAuth } from "@/lib/auth/session";
import { withErrorHandler, apiResponse } from "@/lib/validation";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

// GET /api/mastery?studentId=&competencyNodeId= (optional filters)
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const { searchParams } = req.nextUrl;
  const requestedStudentId = searchParams.get("studentId");
  const competencyNodeId = searchParams.get("competencyNodeId");

  let studentProfileId: string;

  if (session.user.role === "STUDENT") {
    // Students can only see their own mastery
    const profile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) throw new NotFoundError("StudentProfile");
    studentProfileId = profile.id;
  } else {
    // Mentors/admins can view any student
    if (!requestedStudentId) throw new ForbiddenError("studentId required for mentor access");
    studentProfileId = requestedStudentId;
  }

  const masteryStates = await db.masteryState.findMany({
    where: {
      studentId: studentProfileId,
      ...(competencyNodeId ? { competencyNodeId } : {}),
    },
    include: {
      competencyNode: {
        select: {
          id: true,
          subject: true,
          domain: true,
          skill: true,
          subSkill: true,
          title: true,
          difficulty: true,
        },
      },
    },
    orderBy: { computedAt: "desc" },
  });

  // Include evidence counts per level for transparency (never fabricate)
  const evidenceCounts = await db.masteryEvidence.groupBy({
    by: ["competencyNodeId", "cognitiveLevel"],
    where: {
      studentId: studentProfileId,
      ...(competencyNodeId ? { competencyNodeId } : {}),
    },
    _count: { id: true },
  });

  return apiResponse({ masteryStates, evidenceCounts });
});
