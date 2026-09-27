import { db } from "@/db/client";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cognitiveLabel, difficultyLabel } from "@/lib/utils";
import { QuestionFilters } from "./QuestionFilters";

const STATUS_COLORS = {
  DRAFT: "muted",
  REVIEWED: "warning",
  APPROVED: "success",
  DEPRECATED: "destructive",
} as const;

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ nodeId?: string; status?: string; cognitiveLevel?: string; q?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/mentor/cohort");

  const sp = await searchParams;
  const where = {
    ...(sp.nodeId && { competencyNodeId: sp.nodeId }),
    ...(sp.status && { validationStatus: sp.status as never }),
    ...(sp.cognitiveLevel && { cognitiveLevel: sp.cognitiveLevel as never }),
    ...(sp.q && { questionText: { contains: sp.q, mode: "insensitive" as const } }),
  };

  const [questions, total, competencyNodes] = await Promise.all([
    db.question.findMany({
      where,
      take: 50,
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
        _count: { select: { attempts: true } },
      },
    }),
    db.question.count({ where }),
    db.competencyNode.findMany({
      where: { isActive: true },
      select: { id: true, title: true, subject: true },
      orderBy: [{ subject: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Question Bank</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} question{total !== 1 ? "s" : ""}
            {Object.keys(where).length > 0 && " (filtered)"}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/questions/new">Add Question</Link>
        </Button>
      </div>

      <QuestionFilters competencyNodes={competencyNodes} />

      {questions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">No questions match these filters.</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {questions.map((q) => (
            <div key={q.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <Badge
                      variant={STATUS_COLORS[q.validationStatus as keyof typeof STATUS_COLORS] ?? "muted"}
                      className="text-xs"
                    >
                      {q.validationStatus}
                    </Badge>
                    <Badge variant="muted" className="text-xs">
                      {cognitiveLabel(q.cognitiveLevel)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {q.questionType.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {difficultyLabel(q.difficulty)}
                    </Badge>
                    {q.authorType === "AI_GENERATED" && (
                      <Badge variant="muted" className="text-xs">AI</Badge>
                    )}
                    {!q.isActive && (
                      <Badge variant="destructive" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{q.questionText}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {q.competencyNode.subject.replace(/_/g, " ")} ·{" "}
                    {q.competencyNode.title} ·{" "}
                    {q._count.attempts} attempt{q._count.attempts !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/questions/${q.id}`}>Edit</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
