import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { ok, NotFoundError, ForbiddenError } from "@cs-platform/shared";

const router = Router();
const db = new PrismaClient();

function requireAdmin(req: any) {
  if (req.headers["x-user-role"] !== "ADMIN") throw new ForbiddenError("Admin only");
}

const QuestionSchema = z.object({
  competencyNodeId: z.string().min(1),
  type: z.enum(["MCQ","MULTI_SELECT","SHORT_ANSWER","EXPLAIN","SCENARIO","REASONING","COMPARE_CONTRAST","DEBUG"]),
  cognitiveLevel: z.enum(["RECALL","UNDERSTANDING","APPLICATION","REASONING","DEFENSIBILITY"]),
  difficulty: z.enum(["EASY","MEDIUM","HARD"]),
  stem: z.string().min(1),
  scenarioContext: z.string().optional(),
  referenceAnswer: z.string().optional(),
  rubric: z.string().optional(),
  timeEstimateSeconds: z.number().int().optional(),
  validationStatus: z.enum(["DRAFT","REVIEW","APPROVED","DEPRECATED"]).default("DRAFT"),
  options: z.array(z.object({
    text: z.string().min(1),
    isCorrect: z.boolean(),
    explanation: z.string().optional(),
    sortOrder: z.number().int().default(0),
  })).optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const role = req.headers["x-user-role"] as string;
    if (!["MENTOR", "ADMIN"].includes(role)) throw new ForbiddenError();
    const { nodeId, status, cognitiveLevel, q } = req.query as Record<string, string>;
    const page = Math.max(1, parseInt((req.query.page as string) ?? "1"));
    const limit = Math.min(100, parseInt((req.query.limit as string) ?? "20"));

    const where = {
      ...(nodeId ? { competencyNodeId: nodeId } : {}),
      ...(status ? { validationStatus: status as never } : {}),
      ...(cognitiveLevel ? { cognitiveLevel: cognitiveLevel as never } : {}),
      ...(q ? { stem: { contains: q, mode: "insensitive" as never } } : {}),
    };
    const [questions, total] = await Promise.all([
      db.question.findMany({ where, include: { competencyNode: { select: { title: true, subject: true } }, options: true, _count: { select: { attempts: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      db.question.count({ where }),
    ]);
    ok(res, { questions, total, page, limit });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    requireAdmin(req);
    const userId = req.headers["x-user-id"] as string;
    const body = QuestionSchema.parse(req.body);
    const { options, ...data } = body;
    const question = await db.question.create({
      data: { ...data, authoredByUserId: userId, ...(options ? { options: { create: options } } : {}) },
      include: { options: true },
    });
    ok(res, { question }, 201);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const question = await db.question.findUnique({
      where: { id: req.params.id },
      include: { options: true, competencyNode: { select: { title: true, subject: true } }, _count: { select: { attempts: true } } },
    });
    if (!question) throw new NotFoundError("Question");
    ok(res, { question });
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = QuestionSchema.partial().parse(req.body);
    const { options, ...data } = body;
    const question = await db.question.update({
      where: { id: req.params.id },
      data: { ...data, version: { increment: 1 } },
      include: { options: true },
    });
    ok(res, { question });
  } catch (err) { next(err); }
});

export default router;
