import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { requireStudent } from "@/lib/auth/session";
import { withErrorHandler, apiResponse } from "@/lib/validation";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

// Get questions for an assessment — returns questions without correct answers
export const GET = withErrorHandler(
  async (_req: NextRequest, ctx: unknown) => {
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
          include: {
            competencyNode: {
              include: {
                questions: {
                  where: {
                    isActive: true,
                    validationStatus: "APPROVED",
                  },
                  orderBy: [{ cognitiveLevel: "asc" }, { difficulty: "asc" }],
                },
              },
            },
          },
        },
      },
    });

    if (!assessment) throw new NotFoundError("Assessment");
    if (assessment.studentId !== studentProfile.id) throw new ForbiddenError();

    // Never expose correctAnswer or referenceAnswer to the client
    const questions = assessment.competencyNodes.flatMap(({ competencyNode }) =>
      competencyNode.questions.map((q) => ({
        id: q.id,
        competencyNodeId: q.competencyNodeId,
        questionText: q.questionText,
        questionType: q.questionType,
        cognitiveLevel: q.cognitiveLevel,
        difficulty: q.difficulty,
        options: q.options
          ? (q.options as Array<{ id: string; text: string; isCorrect: boolean }>).map(
              ({ id, text }) => ({ id, text }) // strip isCorrect
            )
          : null,
        scenarioContext: q.scenarioContext,
        estimatedMinutes: q.estimatedMinutes,
        rubric: q.rubric
          ? { criteria: (q.rubric as { criteria: Array<{ name: string; weight: number }> }).criteria.map(({ name }) => ({ name })) }
          : null,
      }))
    );

    return apiResponse({ questions, assessmentId: id, type: assessment.type });
  }
);
