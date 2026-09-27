import { auth } from "@/lib/auth/config";
import { db } from "@/db/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cognitiveLabel, scoreToPercent, difficultyLabel } from "@/lib/utils";
import type { CognitiveLevel } from "@prisma/client";

const COGNITIVE_LEVELS: CognitiveLevel[] = [
  "RECALL",
  "UNDERSTANDING",
  "APPLICATION",
  "REASONING",
  "DEFENSIBILITY",
];

export default async function DashboardPage() {
  const session = await auth();
  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session!.user.id },
    include: {
      masteryStates: {
        include: {
          competencyNode: {
            select: {
              id: true,
              subject: true,
              domain: true,
              title: true,
              difficulty: true,
            },
          },
        },
        orderBy: { computedAt: "desc" },
        take: 20,
      },
      _count: { select: { attempts: true, assessments: true } },
    },
  });

  const pendingAssessments = await db.assessment.count({
    where: {
      studentId: studentProfile?.id,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
  });

  type MasteryState = NonNullable<typeof studentProfile>["masteryStates"][number];

  // Group mastery by subject
  const masteryStates: MasteryState[] = studentProfile?.masteryStates ?? [];
  const masteryBySubject = masteryStates.reduce(
    (acc, ms) => {
      const subject = ms.competencyNode.subject;
      if (!acc[subject]) acc[subject] = [];
      acc[subject].push(ms);
      return acc;
    },
    {} as Record<string, MasteryState[]>
  );

  const hasMastery = masteryStates.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back, {session!.user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your placement readiness progress across CS fundamentals
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Attempts"
          value={studentProfile?._count.attempts ?? 0}
        />
        <StatCard
          label="Assessments"
          value={studentProfile?._count.assessments ?? 0}
        />
        <StatCard
          label="Competencies Assessed"
          value={studentProfile?.masteryStates.length ?? 0}
        />
        <StatCard label="In Progress" value={pendingAssessments} />
      </div>

      {/* Mastery overview */}
      {hasMastery ? (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-foreground">
            Competency Evidence
          </h2>
          {Object.entries(masteryBySubject).map(([subject, states]) => (
            <div key={subject}>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                {subject.replace(/_/g, " ")}
              </p>
              <div className="divide-y divide-border rounded-lg border">
                {states.map((ms) => (
                  <CompetencyRow key={ms.id} ms={ms} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function CompetencyRow({ ms }: { ms: {
  id: string;
  competencyNode: { id: string; title: string; difficulty: string };
  recallScore: number | null;
  understandingScore: number | null;
  applicationScore: number | null;
  reasoningScore: number | null;
  defensibilityScore: number | null;
  evidenceCount: number;
}}) {
  const scores: Record<CognitiveLevel, number | null> = {
    RECALL: ms.recallScore,
    UNDERSTANDING: ms.understandingScore,
    APPLICATION: ms.applicationScore,
    REASONING: ms.reasoningScore,
    DEFENSIBILITY: ms.defensibilityScore,
  };

  return (
    <div className="px-4 py-3 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/competencies/${ms.competencyNode.id}`}
            className="text-sm font-medium text-foreground hover:text-primary"
          >
            {ms.competencyNode.title}
          </Link>
          <Badge variant="muted" className="text-xs">
            {difficultyLabel(ms.competencyNode.difficulty)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {ms.evidenceCount} evidence record{ms.evidenceCount !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {COGNITIVE_LEVELS.map((level) => {
          const score = scores[level];
          return (
            <div key={level} className="text-center">
              <div
                className="text-xs font-medium"
                title={`${cognitiveLabel(level)}: ${scoreToPercent(score)}`}
              >
                {score === null ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <ScorePill score={score} />
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">
                {level.charAt(0)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80
      ? "bg-emerald-100 text-emerald-700"
      : pct >= 60
      ? "bg-blue-100 text-blue-700"
      : pct >= 40
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${color}`}>
      {pct}%
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <h3 className="text-sm font-medium text-foreground mb-1">
        No competencies assessed yet
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Start with an assessment to build your competency evidence profile.
      </p>
      <Button asChild size="sm">
        <Link href="/competencies">Explore Competencies</Link>
      </Button>
    </div>
  );
}
