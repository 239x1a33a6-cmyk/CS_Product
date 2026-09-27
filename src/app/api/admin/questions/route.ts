import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { withErrorHandler, apiResponse, parseBody, paginate } from "@/lib/validation";

const OptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
});

const RubricCriterionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  weight: z.number(),
});

const CreateQuestionSchema = z.object({
  competencyNodeId: z.string().min(1),
  questionText: z.string().min(1),
  questionType: z.enum([
    "MCQ", "MULTI_SELECT", "SHORT_ANSWER", "EXPLAIN",
    "SCENARIO", "REASONING", "COMPARE_CONTRAST", "DEBUG",
  ]),
  cognitiveLevel: z.enum(["RECALL", "UNDERSTANDING", "APPLICATION", "REASONING", "DEFENSIBILITY"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  options: z.array(OptionSchema).optional(),
  correctAnswer: z.string().optional(),
  referenceAnswer: z.string().optional(),
  explanation: z.string().min(1),
  scenarioContext: z.string().optional(),
  misconceptionTargeted: z.string().optional(),
  rubric: z.object({ criteria: z.array(RubricCriterionSchema) }).optional(),
  estimatedMinutes: z.number().int().min(1).max(30).default(3),
  validationStatus: z.enum(["DRAFT", "REVIEWED", "APPROVED", "DEPRECATED"]).default("DRAFT"),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const { skip, take } = paginate(sp);
  const nodeId = sp.get("nodeId");
  const status = sp.get("status");
  const cogLevel = sp.get("cognitiveLevel");
  const search = sp.get("q");

  const where = {
    ...(nodeId && { competencyNodeId: nodeId }),
    ...(status && { validationStatus: status as never }),
    ...(cogLevel && { cognitiveLevel: cogLevel as never }),
    ...(search && { questionText: { contains: search, mode: "insensitive" as const } }),
  };

  const [questions, total] = await Promise.all([
    db.question.findMany({
      where,
      skip,
      take,
      orderBy: [{ validationStatus: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        questionText: true,
        questionType: true,
        cognitiveLevel: true,
        difficulty: true,
        validationStatus: true,
        isActive: true,
        estimatedMinutes: true,
        authorType: true,
        createdAt: true,
        competencyNode: { select: { id: true, title: true, subject: true } },
      },
    }),
    db.question.count({ where }),
  ]);

  return apiResponse({ questions, total });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await parseBody(req, CreateQuestionSchema);

  const question = await db.question.create({
    data: {
      competencyNodeId: body.competencyNodeId,
      questionText: body.questionText,
      questionType: body.questionType,
      cognitiveLevel: body.cognitiveLevel,
      difficulty: body.difficulty,
      options: body.options ?? undefined,
      correctAnswer: body.correctAnswer,
      referenceAnswer: body.referenceAnswer,
      explanation: body.explanation,
      scenarioContext: body.scenarioContext,
      misconceptionTargeted: body.misconceptionTargeted,
      rubric: body.rubric ?? undefined,
      estimatedMinutes: body.estimatedMinutes,
      validationStatus: body.validationStatus,
      authorType: "HUMAN",
    },
  });

  return apiResponse({ question }, 201);
});
