import { auth } from "@/lib/auth/config";
import { db } from "@/db/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cognitiveLabel, scoreToPercent } from "@/lib/utils";
import type { CognitiveLevel } from "@prisma/client";

const COGNITIVE_LEVELS: CognitiveLevel[] = [
  "RECALL",
  "UNDERSTANDING",
  "APPLICATION",
  "REASONING",
  "DEFENSIBILITY",
];

export default async function ProgressPage() {
  const session = await auth();
  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session!.user.id },
    include: {
      masteryStates: {
        include: {
          competencyNode: {
            select: {
              id: true,
              title: true,
              subject: true,
              domain: true,
              difficulty: true,
            },
          },
        },
        orderBy: { computedAt: "desc" },
      },
      interventions: {
        include: {
          mentor: { select: { name: true } },
          competencyNode: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  const recentAttempts = await db.attempt.findMany({
    where: { studentId: studentProfile?.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      question: {
        select: {
          questionText: true,
          cognitiveLevel: true,
          competencyNode: { select: { title: true } },
        },
      },
      evaluationFeedback: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Evidence-based mastery tracking across all cognitive levels
        </p>
      </div>

      {/* Mastery dimension explanation */}
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          How mastery is measured
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {COGNITIVE_LEVELS.map((level) => (
            <div key={level} className="text-center">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium level-${level.toLowerCase()}`}
              >
                {cognitiveLabel(level)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Each score is computed from your actual attempt evidence, weighted by recency and quality. A score only appears once you have evidence at that level.
        </p>
      </div>

      {/* Mastery table */}
      {(studentProfile?.masteryStates ?? []).length > 0 ? (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            Competency Mastery
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 text-xs font-medium text-muted-foreground">
                    Competency
                  </th>
                  {COGNITIVE_LEVELS.map((level) => (
                    <th
                      key={level}
                      className="pb-2 text-xs font-medium text-muted-foreground text-center"
                    >
                      {level.charAt(0) + level.slice(1).toLowerCase().slice(0, 3)}
                    </th>
                  ))}
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-right">
                    Evidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {studentProfile!.masteryStates.map((ms) => {
                  const scores = [
                    ms.recallScore,
                    ms.understandingScore,
                    ms.applicationScore,
                    ms.reasoningScore,
                    ms.defensibilityScore,
                  ];
                  return (
                    <tr key={ms.id}>
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/competencies/${ms.competencyNode.id}`}
                          className="text-foreground hover:text-primary"
                        >
                          {ms.competencyNode.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {ms.competencyNode.domain}
                        </p>
                      </td>
                      {scores.map((score, i) => (
                        <td key={i} className="py-2.5 text-center">
                          {score === null ? (
                            <span className="text-muted-foreground text-xs">—</span>
                          ) : (
                            <ScoreCell score={score} />
                          )}
                        </td>
                      ))}
                      <td className="py-2.5 text-right text-xs text-muted-foreground">
                        {ms.evidenceCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No mastery data yet. Complete some assessments to build your evidence profile.
          </p>
        </div>
      )}

      {/* Recent attempt history */}
      {recentAttempts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            Recent Attempts
          </h2>
          <div className="divide-y divide-border rounded-lg border">
            {recentAttempts.map((a) => {
              const latestFeedback = a.evaluationFeedback[0];
              return (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">
                        {a.question.competencyNode.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {a.question.questionText}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="muted" className="text-xs">
                        {a.question.cognitiveLevel}
                      </Badge>
                      {a.evaluationStatus === "MENTOR_REVIEWED" && (
                        <Badge variant="success" className="text-xs">
                          Reviewed
                        </Badge>
                      )}
                      {a.evaluationStatus === "AI_EVALUATED" && (
                        <Badge variant="warning" className="text-xs">
                          AI Evaluated
                        </Badge>
                      )}
                      {a.scoreRaw !== null && (
                        <span
                          className={`text-sm font-medium ${
                            a.scoreRaw >= 0.7
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {Math.round(a.scoreRaw * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {latestFeedback?.strengths && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {latestFeedback.strengths}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mentor interventions */}
      {(studentProfile?.interventions ?? []).length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            Mentor Interventions
          </h2>
          <div className="divide-y divide-border rounded-lg border">
            {studentProfile!.interventions.map((intervention) => (
              <div key={intervention.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {intervention.type.replace(/_/g, " ")}
                      {intervention.competencyNode && (
                        <span className="text-muted-foreground font-normal">
                          {" "}— {intervention.competencyNode.title}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      From {intervention.mentor.name} ·{" "}
                      {new Date(intervention.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      intervention.status === "COMPLETED"
                        ? "success"
                        : intervention.status === "IN_PROGRESS"
                        ? "default"
                        : "muted"
                    }
                  >
                    {intervention.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {intervention.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCell({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80
      ? "text-emerald-600"
      : pct >= 60
      ? "text-blue-600"
      : pct >= 40
      ? "text-amber-600"
      : "text-red-600";
  return <span className={`text-xs font-medium ${color}`}>{pct}%</span>;
}
