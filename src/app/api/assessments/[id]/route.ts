import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { requireStudent } from "@/lib/auth/session";
import { withErrorHandler, apiResponse } from "@/lib/validation";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

export const GET = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  const session = await requireStudent();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!studentProfile) throw new NotFoundError("StudentProfile");

  const assessment = await db.assessment.findUnique({
    where: { id },
    include: {
      competencyNodes: {
        include: { competencyNode: { select: { id: true, title: true, subject: true } } },
      },
      attempts: {
        orderBy: { createdAt: "asc" },
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              questionType: true,
              cognitiveLevel: true,
              difficulty: true,
              explanation: true,
            },
          },
          evaluationFeedback: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              strengths: true,
              gaps: true,
              suggestedRemediation: true,
              feedbackSource: true,
              scoreAdjusted: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!assessment) throw new NotFoundError("Assessment");
  if (assessment.studentId !== studentProfile.id) throw new ForbiddenError();

  return apiResponse({ assessment });
});
