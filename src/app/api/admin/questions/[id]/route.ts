import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { withErrorHandler, apiResponse, parseBody } from "@/lib/validation";
import { NotFoundError } from "@/lib/errors";

const UpdateQuestionSchema = z.object({
  questionText: z.string().min(1).optional(),
  questionType: z.enum([
    "MCQ", "MULTI_SELECT", "SHORT_ANSWER", "EXPLAIN",
    "SCENARIO", "REASONING", "COMPARE_CONTRAST", "DEBUG",
  ]).optional(),
  cognitiveLevel: z.enum(["RECALL", "UNDERSTANDING", "APPLICATION", "REASONING", "DEFENSIBILITY"]).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean(),
  })).optional(),
  correctAnswer: z.string().optional(),
  referenceAnswer: z.string().optional(),
  explanation: z.string().min(1).optional(),
  scenarioContext: z.string().optional(),
  misconceptionTargeted: z.string().optional(),
  rubric: z.object({
    criteria: z.array(z.object({ name: z.string(), description: z.string().optional(), weight: z.number() })),
  }).optional(),
  estimatedMinutes: z.number().int().min(1).max(30).optional(),
  validationStatus: z.enum(["DRAFT", "REVIEWED", "APPROVED", "DEPRECATED"]).optional(),
  isActive: z.boolean().optional(),
});

export const GET = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;

  const question = await db.question.findUnique({
    where: { id },
    include: {
      competencyNode: { select: { id: true, title: true, subject: true, domain: true } },
      _count: { select: { attempts: true } },
    },
  });

  if (!question) throw new NotFoundError("Question");
  return apiResponse({ question });
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  await requireAdmin();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  const body = await parseBody(req, UpdateQuestionSchema);

  const existing = await db.question.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Question");

  const question = await db.question.update({
    where: { id },
    data: {
      ...(body.questionText && { questionText: body.questionText }),
      ...(body.questionType && { questionType: body.questionType }),
      ...(body.cognitiveLevel && { cognitiveLevel: body.cognitiveLevel }),
      ...(body.difficulty && { difficulty: body.difficulty }),
      ...(body.options !== undefined && { options: body.options }),
      ...(body.correctAnswer !== undefined && { correctAnswer: body.correctAnswer }),
      ...(body.referenceAnswer !== undefined && { referenceAnswer: body.referenceAnswer }),
      ...(body.explanation && { explanation: body.explanation }),
      ...(body.scenarioContext !== undefined && { scenarioContext: body.scenarioContext }),
      ...(body.misconceptionTargeted !== undefined && { misconceptionTargeted: body.misconceptionTargeted }),
      ...(body.rubric !== undefined && { rubric: body.rubric }),
      ...(body.estimatedMinutes && { estimatedMinutes: body.estimatedMinutes }),
      ...(body.validationStatus && { validationStatus: body.validationStatus }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      version: { increment: 1 },
    },
  });

  return apiResponse({ question });
});
