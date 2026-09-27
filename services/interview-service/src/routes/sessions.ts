import { Router } from "express";
import { z } from "zod";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { ok, NotFoundError, ForbiddenError } from "@cs-platform/shared";

const router = Router();
const db = new PrismaClient();

const AI_URL = process.env.AI_SERVICE_URL ?? "http://localhost:4007";

type BranchCondition = "STRONG" | "PARTIAL" | "WEAK";
const THRESHOLDS = { STRONG: 0.75, PARTIAL: 0.4 };

function scoreToBranch(score: number): BranchCondition {
  if (score >= THRESHOLDS.STRONG) return "STRONG";
  if (score >= THRESHOLDS.PARTIAL) return "PARTIAL";
  return "WEAK";
}

function deriveCurrentNodeId(graph: any, turns: { followUpTrigger: string | null }[]): string | null {
  let nodeId: string | null = graph.startNodeId;
  for (const turn of turns) {
    if (!nodeId) return null;
    const node = graph.nodes[nodeId];
    if (!node) return null;
    const branch = node.branches.find((b: any) => b.condition === turn.followUpTrigger);
    nodeId = branch?.nextNodeId ?? null;
  }
  return nodeId;
}

async function getOrCreateStudentProfile(db: PrismaClient, userId: string) {
  let p = await db.studentProfile.findUnique({ where: { userId } });
  if (!p) p = await db.studentProfile.create({ data: { userId } });
  return p;
}

// GET /api/interviews — scripts + student sessions
router.get("/", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const profile = await getOrCreateStudentProfile(db, userId);
    const [scripts, sessions] = await Promise.all([
      db.interviewScript.findMany({ where: { isActive: true }, include: { competencyNode: { select: { title: true, subject: true } } } }),
      db.interviewSession.findMany({ where: { studentId: profile.id }, include: { script: { select: { title: true } } }, orderBy: { createdAt: "desc" } }),
    ]);
    ok(res, { scripts, sessions });
  } catch (err) { next(err); }
});

// POST /api/interviews — start session
router.post("/", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { scriptId } = z.object({ scriptId: z.string() }).parse(req.body);
    const profile = await getOrCreateStudentProfile(db, userId);
    const script = await db.interviewScript.findUnique({ where: { id: scriptId } });
    if (!script) throw new NotFoundError("Script");
    const session = await db.interviewSession.create({
      data: { studentId: profile.id, scriptId, type: "SCRIPTED", status: "IN_PROGRESS", startedAt: new Date() },
    });
    ok(res, { session }, 201);
  } catch (err) { next(err); }
});

// GET /api/interviews/:id — session state + current node
router.get("/:id", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const profile = await getOrCreateStudentProfile(db, userId);
    const session = await db.interviewSession.findUnique({
      where: { id: req.params.id },
      include: {
        script: true,
        turns: { orderBy: { turnIndex: "asc" } },
      },
    });
    if (!session) throw new NotFoundError("Session");
    if (session.studentId !== profile.id) throw new ForbiddenError();

    const graph = session.script.scriptGraph as any;
    const currentNodeId = deriveCurrentNodeId(graph, session.turns);
    const currentNode = currentNodeId ? graph.nodes[currentNodeId] : null;

    ok(res, { session, currentNode, currentNodeId, totalNodes: Object.keys(graph.nodes).length });
  } catch (err) { next(err); }
});

// POST /api/interviews/:id/respond — submit answer for current turn
router.post("/:id/respond", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { responseText } = z.object({ responseText: z.string().min(1) }).parse(req.body);
    const profile = await getOrCreateStudentProfile(db, userId);

    const session = await db.interviewSession.findUnique({
      where: { id: req.params.id },
      include: { script: true, turns: { orderBy: { turnIndex: "asc" } } },
    });
    if (!session || session.studentId !== profile.id) throw new ForbiddenError();
    if (session.status !== "IN_PROGRESS") throw new ForbiddenError("Session not in progress");

    const graph = session.script.scriptGraph as any;
    const currentNodeId = deriveCurrentNodeId(graph, session.turns);
    if (!currentNodeId) throw new NotFoundError("Current node");
    const currentNode = graph.nodes[currentNodeId];

    // AI evaluation
    let scoreRaw = 0.3;
    let evalNotes = "{}";
    try {
      const { data } = await axios.post(`${AI_URL}/api/ai/evaluate`, {
        question: currentNode.questionText,
        studentAnswer: responseText,
        evaluationHint: currentNode.evaluationHint,
      });
      const result = data.data;
      scoreRaw = result.scoreRaw ?? 0.3;
      evalNotes = JSON.stringify({ strengths: result.strengths, gaps: result.gaps, suggestedRemediation: result.suggestedRemediation });
    } catch { /* non-blocking */ }

    const branchCondition = scoreToBranch(scoreRaw);
    const nextBranch = currentNode.branches.find((b: any) => b.condition === branchCondition);
    const isLast = !nextBranch?.nextNodeId;

    const turn = await db.interviewTurn.create({
      data: {
        sessionId: req.params.id,
        turnIndex: session.turns.length,
        nodeId: currentNodeId,
        questionText: currentNode.questionText,
        responseText,
        scoreRaw,
        evaluationNotes: evalNotes,
        followUpTrigger: branchCondition,
      },
    });

    if (isLast) {
      const avgScore = session.turns.reduce((s, t) => s + (t.scoreRaw ?? 0), scoreRaw) / (session.turns.length + 1);
      await db.interviewSession.update({
        where: { id: req.params.id },
        data: { status: "COMPLETED", completedAt: new Date(), overallScore: avgScore },
      });
    }

    ok(res, { turn, branchCondition, isLast, nextNodeId: nextBranch?.nextNodeId ?? null });
  } catch (err) { next(err); }
});

export default router;
