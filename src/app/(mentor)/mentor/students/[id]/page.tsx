import { auth } from "@/lib/auth/config";
import { db } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cognitiveLabel } from "@/lib/utils";
import type { CognitiveLevel } from "@prisma/client";
import { CreateInterventionForm } from "./CreateInterventionForm";

const COGNITIVE_LEVELS: CognitiveLevel[] = [
  "RECALL",
  "UNDERSTANDING",
  "APPLICATION",
  "REASONING",
  "DEFENSIBILITY",
];

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const student = await db.studentProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      cohort: { select: { name: true } },
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
      },
      masteryEvidence: {
        orderBy: { recordedAt: "desc" },
        take: 20,
        include: {
          competencyNode: { select: { title: true } },
        },
      },
    },
  });

  if (!student) notFound();

  const competencyNodes = await db.competencyNode.findMany({
    where: { isActive: true },
    select: { id: true, title: true, subject: true },
    orderBy: [{ subject: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="max-w-5xl space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/mentor/cohort" className="hover:text-foreground">
          Cohort
        </Link>
        <span>/</span>
        <span className="text-foreground">{student.user.name}</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {student.user.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {student.user.email}
          {student.cohort && <> · {student.cohort.name}</>}
        </p>
      </div>

      {/* Mastery overview */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          Mastery Evidence
        </h2>
        {student.masteryStates.length > 0 ? (
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
                      title={cognitiveLabel(level)}
                    >
                      {level.slice(0, 4)}
                    </th>
                  ))}
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-right">
                    Evidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {student.masteryStates.map((ms) => {
                  const scores = [
                    ms.recallScore,
                    ms.understandingScore,
                    ms.applicationScore,
                    ms.reasoningScore,
                    ms.defensibilityScore,
                  ];
                  const hasWeakness = scores.some(
                    (s) => s !== null && s < 0.5
                  );
                  return (
                    <tr
                      key={ms.id}
                      className={hasWeakness ? "bg-red-50/30" : ""}
                    >
                      <td className="py-2.5 pr-4">
                        <p className="text-foreground">
                          {ms.competencyNode.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ms.competencyNode.domain}
                        </p>
                      </td>
                      {scores.map((score, i) => (
                        <td key={i} className="py-2.5 text-center">
                          {score === null ? (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          ) : (
                            <span
                              className={`text-xs font-medium ${
                                score >= 0.8
                                  ? "text-emerald-600"
                                  : score >= 0.6
                                  ? "text-blue-600"
                                  : score >= 0.4
                                  ? "text-amber-600"
                                  : "text-red-600"
                              }`}
                            >
                              {Math.round(score * 100)}%
                            </span>
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
        ) : (
          <p className="text-sm text-muted-foreground">
            No assessments completed yet.
          </p>
        )}
      </div>

      {/* Recent evidence log */}
      {student.masteryEvidence.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            Evidence Log
          </h2>
          <div className="divide-y divide-border rounded-lg border text-sm">
            {student.masteryEvidence.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <div>
                  <span className="text-foreground">
                    {e.competencyNode.title}
                  </span>
                  <span className="text-muted-foreground mx-2">·</span>
                  <span className="text-muted-foreground">
                    {cognitiveLabel(e.cognitiveLevel)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
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
                    className="text-xs"
                  >
                    {e.quality}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.recordedAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create intervention */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          Create Intervention
        </h2>
        <CreateInterventionForm
          studentProfileId={student.id}
          competencyNodes={competencyNodes}
        />
      </div>

      {/* Intervention history */}
      {student.interventions.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            Intervention History
          </h2>
          <div className="divide-y divide-border rounded-lg border">
            {student.interventions.map((i) => (
              <div key={i.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {i.type.replace(/_/g, " ")}
                      {i.competencyNode && (
                        <span className="text-muted-foreground font-normal">
                          {" "}— {i.competencyNode.title}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {i.mentor.name} ·{" "}
                      {new Date(i.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      i.status === "COMPLETED"
                        ? "success"
                        : i.status === "IN_PROGRESS"
                        ? "default"
                        : "muted"
                    }
                  >
                    {i.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {i.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
