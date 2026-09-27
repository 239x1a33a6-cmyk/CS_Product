import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { ok, NotFoundError, ForbiddenError } from "@cs-platform/shared";

const router = Router();
const db = new PrismaClient();

function requireAdmin(req: any) {
  if (req.headers["x-user-role"] !== "ADMIN") throw new ForbiddenError("Admin only");
}

const ScriptSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  competencyNodeId: z.string().min(1),
  estimatedMinutes: z.number().int().optional(),
  scriptGraph: z.object({
    startNodeId: z.string(),
    nodes: z.record(z.object({
      id: z.string(),
      questionText: z.string(),
      evaluationHint: z.string(),
      competencyNodeId: z.string().optional().nullable(),
      estimatedMinutes: z.number().optional(),
      branches: z.array(z.object({
        condition: z.enum(["STRONG", "PARTIAL", "WEAK"]),
        nextNodeId: z.string().nullable(),
        label: z.string(),
      })),
    })),
  }),
});

router.get("/", async (req, res, next) => {
  try {
    const role = req.headers["x-user-role"] as string;
    if (!["MENTOR", "ADMIN"].includes(role)) throw new ForbiddenError();
    const scripts = await db.interviewScript.findMany({
      where: { isActive: true },
      include: { competencyNode: { select: { title: true, subject: true } }, _count: { select: { sessions: true } } },
      orderBy: { createdAt: "desc" },
    });
    ok(res, { scripts });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    requireAdmin(req);
    const userId = req.headers["x-user-id"] as string;
    const body = ScriptSchema.parse(req.body);
    const script = await db.interviewScript.create({
      data: { ...body, authoredByUserId: userId, scriptGraph: body.scriptGraph as never },
      include: { competencyNode: { select: { title: true } } },
    });
    ok(res, { script }, 201);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const role = req.headers["x-user-role"] as string;
    if (!["MENTOR", "ADMIN"].includes(role)) throw new ForbiddenError();
    const script = await db.interviewScript.findUnique({
      where: { id: req.params.id },
      include: { competencyNode: { select: { title: true, subject: true } } },
    });
    if (!script) throw new NotFoundError("Script");
    ok(res, { script });
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = ScriptSchema.partial().parse(req.body);
    const script = await db.interviewScript.update({
      where: { id: req.params.id },
      data: { ...body, ...(body.scriptGraph ? { scriptGraph: body.scriptGraph as never, version: { increment: 1 } } : {}) },
    });
    ok(res, { script });
  } catch (err) { next(err); }
});

export default router;
