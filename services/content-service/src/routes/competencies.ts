import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { ok, NotFoundError, ForbiddenError } from "@cs-platform/shared";

const router = Router();
const db = new PrismaClient();

function requireAdmin(req: any) {
  if (req.headers["x-user-role"] !== "ADMIN") throw new ForbiddenError("Admin only");
}

const NodeSchema = z.object({
  subject: z.enum(["OPERATING_SYSTEMS","DBMS","SQL","COMPUTER_NETWORKS","OOP","SOFTWARE_ENGINEERING","COMPUTER_ARCHITECTURE","ALGORITHMS","DATA_STRUCTURES"]),
  domain: z.string().min(1),
  skill: z.string().min(1),
  subSkill: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  learningObjective: z.string().min(1),
  difficulty: z.enum(["FOUNDATIONAL", "INTERMEDIATE", "ADVANCED"]),
  misconceptions: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
});

router.get("/", async (req, res, next) => {
  try {
    const role = req.headers["x-user-role"] as string;
    if (!["MENTOR", "ADMIN"].includes(role)) throw new ForbiddenError();
    const subject = req.query.subject as string | undefined;
    const nodes = await db.competencyNode.findMany({
      where: { isActive: true, ...(subject ? { subject: subject as never } : {}) },
      include: { _count: { select: { questions: true, masteryStates: true } } },
      orderBy: [{ subject: "asc" }, { sortOrder: "asc" }],
    });
    ok(res, { nodes });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = NodeSchema.parse(req.body);
    const node = await db.competencyNode.create({ data: body });
    ok(res, { node }, 201);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const node = await db.competencyNode.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { questions: true, masteryStates: true } } },
    });
    if (!node) throw new NotFoundError("Competency node");
    ok(res, { node });
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    requireAdmin(req);
    const body = NodeSchema.partial().parse(req.body);
    const node = await db.competencyNode.update({
      where: { id: req.params.id },
      data: { ...body, version: { increment: 1 } },
    });
    ok(res, { node });
  } catch (err) { next(err); }
});

export default router;
