import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { requireAuth } from "@/lib/auth/session";
import { withErrorHandler, apiResponse } from "@/lib/validation";
import { NotFoundError } from "@/lib/errors";

export const GET = withErrorHandler(
  async (_req: NextRequest, ctx: unknown) => {
    await requireAuth();
    const { id } = await (ctx as { params: Promise<{ id: string }> }).params;

    const node = await db.competencyNode.findUnique({
      where: { id, isActive: true },
      include: {
        prerequisites: { select: { id: true, title: true, difficulty: true } },
        dependents: { select: { id: true, title: true, difficulty: true } },
        questions: {
          where: { isActive: true, validationStatus: "APPROVED" },
          select: {
            id: true,
            questionType: true,
            cognitiveLevel: true,
            difficulty: true,
            estimatedMinutes: true,
          },
        },
      },
    });

    if (!node) throw new NotFoundError("Competency");

    return apiResponse({ node });
  }
);
