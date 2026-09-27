import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { withErrorHandler, parseBody, apiResponse, paginate } from "@/lib/validation";

const CreateSchema = z.object({
  subject: z.enum([
    "OPERATING_SYSTEMS",
    "DBMS",
    "SQL",
    "COMPUTER_NETWORKS",
    "OOP",
    "SOFTWARE_ENGINEERING",
    "COMPUTER_ARCHITECTURE",
    "ALGORITHMS",
    "DATA_STRUCTURES",
  ]),
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

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject");
  const { skip, take } = paginate(url.searchParams);

  const where = subject ? { subject: subject as never } : {};

  const [nodes, total] = await Promise.all([
    db.competencyNode.findMany({
      where,
      include: { _count: { select: { questions: true, masteryStates: true } } },
      orderBy: [{ subject: "asc" }, { sortOrder: "asc" }],
      skip,
      take,
    }),
    db.competencyNode.count({ where }),
  ]);

  return apiResponse({ nodes, total, skip, take });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const body = await parseBody(req, CreateSchema);
  const node = await db.competencyNode.create({ data: body });
  return apiResponse({ node }, 201);
});
