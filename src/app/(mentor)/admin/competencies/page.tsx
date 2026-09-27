import { db } from "@/db/client";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SUBJECT_LABELS: Record<string, string> = {
  OPERATING_SYSTEMS: "Operating Systems",
  DBMS: "DBMS",
  SQL: "SQL",
  COMPUTER_NETWORKS: "Computer Networks",
  OOP: "OOP",
  SOFTWARE_ENGINEERING: "Software Engineering",
  COMPUTER_ARCHITECTURE: "Computer Architecture",
  ALGORITHMS: "Algorithms",
  DATA_STRUCTURES: "Data Structures",
};

const DIFFICULTY_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  FOUNDATIONAL: "success",
  INTERMEDIATE: "warning",
  ADVANCED: "destructive",
};

export default async function AdminCompetenciesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/mentor/cohort");

  const { subject } = await searchParams;

  const nodes = await db.competencyNode.findMany({
    where: {
      isActive: true,
      ...(subject ? { subject: subject as never } : {}),
    },
    include: {
      _count: { select: { questions: true, masteryStates: true } },
    },
    orderBy: [{ subject: "asc" }, { sortOrder: "asc" }, { domain: "asc" }],
  });

  // Group by subject
  const grouped = nodes.reduce<Record<string, typeof nodes>>((acc, node) => {
    if (!acc[node.subject]) acc[node.subject] = [];
    acc[node.subject].push(node);
    return acc;
  }, {});

  const subjects = Object.keys(grouped).sort();

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Competency Nodes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {nodes.length} active node{nodes.length !== 1 ? "s" : ""} across{" "}
            {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/competencies/new">New Node</Link>
        </Button>
      </div>

      {/* Subject filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/competencies"
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !subject
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          }`}
        >
          All
        </Link>
        {Object.entries(SUBJECT_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/competencies?subject=${key}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              subject === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {nodes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No competency nodes yet.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/competencies/new">Create first node</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {subjects.map((subj) => (
            <div key={subj}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {SUBJECT_LABELS[subj] ?? subj}
              </h2>
              <div className="divide-y divide-border rounded-lg border">
                {grouped[subj].map((node) => (
                  <div key={node.id} className="flex items-start justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{node.title}</p>
                        <Badge
                          variant={DIFFICULTY_VARIANT[node.difficulty] ?? "muted"}
                          className="text-xs"
                        >
                          {node.difficulty.charAt(0) + node.difficulty.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {node.domain}
                        {node.skill && ` › ${node.skill}`}
                        {node.subSkill && ` › ${node.subSkill}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {node._count.questions} question{node._count.questions !== 1 ? "s" : ""} ·{" "}
                        {node._count.masteryStates} student{node._count.masteryStates !== 1 ? "s" : ""} tracked
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="ml-3 shrink-0">
                      <Link href={`/admin/competencies/${node.id}`}>Edit</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
