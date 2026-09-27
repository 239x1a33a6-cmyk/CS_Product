import { auth } from "@/lib/auth/config";
import { db } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cognitiveLabel, difficultyLabel } from "@/lib/utils";
import type { CognitiveLevel } from "@prisma/client";

const COGNITIVE_ORDER: CognitiveLevel[] = [
  "RECALL",
  "UNDERSTANDING",
  "APPLICATION",
  "REASONING",
  "DEFENSIBILITY",
];

export default async function CompetencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const [node, studentProfile] = await Promise.all([
    db.competencyNode.findUnique({
      where: { id, isActive: true },
      include: {
        prerequisites: { select: { id: true, title: true, difficulty: true } },
        dependents: { select: { id: true, title: true, difficulty: true } },
        questions: {
          where: { isActive: true, validationStatus: "APPROVED" },
          select: { id: true, cognitiveLevel: true, questionType: true, difficulty: true },
        },
      },
    }),
    db.studentProfile.findUnique({
      where: { userId: session!.user.id },
      include: {
        masteryStates: {
          where: { competencyNodeId: id },
        },
        masteryEvidence: {
          where: { competencyNodeId: id },
          orderBy: { recordedAt: "desc" },
          take: 10,
        },
      },
    }),
  ]);

  if (!node) notFound();

  const mastery = studentProfile?.masteryStates[0] ?? null;
  const evidenceList = studentProfile?.masteryEvidence ?? [];

  // Count questions per cognitive level
  const questionsByLevel = COGNITIVE_ORDER.reduce((acc, level) => {
    acc[level] = node.questions.filter((q) => q.cognitiveLevel === level).length;
    return acc;
  }, {} as Record<CognitiveLevel, number>);

  return (
    <div className="max-w-4xl space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/competencies" className="hover:text-foreground">
          Competencies
        </Link>
        <span>/</span>
        <span className="text-foreground">{node.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant="muted">{node.subject.replace(/_/g, " ")}</Badge>
            <Badge variant="muted">{node.domain}</Badge>
            <Badge
              variant={
                node.difficulty === "ADVANCED"
                  ? "warning"
                  : node.difficulty === "INTERMEDIATE"
                  ? "default"
                  : "secondary"
              }
            >
              {difficultyLabel(node.difficulty)}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{node.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {node.description}
          </p>
        </div>
        <Button asChild>
          <Link
            href={`/assessments/new?nodeId=${node.id}`}
          >
            Start Assessment
          </Link>
        </Button>
      </div>

      {/* Learning objective */}
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Learning Objective
        </p>
        <p className="text-sm text-foreground">{node.learningObjective}</p>
      </div>

      {/* Questions by cognitive level */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          Assessment Coverage
        </h2>
        <div className="divide-y divide-border rounded-lg border">
          {COGNITIVE_ORDER.map((level) => {
            const count = questionsByLevel[level];
            const score =
              level === "RECALL"
                ? mastery?.recallScore
                : level === "UNDERSTANDING"
                ? mastery?.understandingScore
                : level === "APPLICATION"
                ? mastery?.applicationScore
                : level === "REASONING"
                ? mastery?.reasoningScore
                : mastery?.defensibilityScore;

            return (
              <div key={level} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {cognitiveLabel(level)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {count} question{count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  {score === null || score === undefined ? (
                    <span className="text-sm text-muted-foreground">Not yet assessed</span>
                  ) : (
                    <span
                      className={`text-sm font-medium ${
                        score >= 0.8
                          ? "text-emerald-600"
                          : score >= 0.6
                          ? "text-blue-600"
                          : score >= 0.4
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {Math.round(score * 100)}% evidence
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Common misconceptions */}
      {node.misconceptions.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            Common Misconceptions
          </h2>
          <ul className="space-y-2">
            {node.misconceptions.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-0.5 text-destructive">✗</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prerequisites */}
      {node.prerequisites.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            Prerequisites
          </h2>
          <div className="flex flex-wrap gap-2">
            {node.prerequisites.map((p) => (
              <Link
                key={p.id}
                href={`/competencies/${p.id}`}
                className="text-sm text-primary hover:underline border rounded-md px-3 py-1"
              >
                {p.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent evidence */}
      {evidenceList.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            Your Evidence
          </h2>
          <div className="divide-y divide-border rounded-lg border">
            {evidenceList.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-foreground">
                    {cognitiveLabel(e.cognitiveLevel)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {e.evidenceType.replace(/_/g, " ")} ·{" "}
                    {new Date(e.recordedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <Badge
                  variant={
                    e.quality === "STRONG"
                      ? "success"
                      : e.quality === "SOLID"
                      ? "default"
                      : e.quality === "PARTIAL"
                      ? "warning"
                      : "destructive"
                  }
                >
                  {e.quality}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
