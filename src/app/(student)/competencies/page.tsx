import { db } from "@/db/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { difficultyLabel } from "@/lib/utils";
import type { Subject } from "@prisma/client";

const SUBJECT_LABELS: Record<Subject, string> = {
  OPERATING_SYSTEMS: "Operating Systems",
  DBMS: "DBMS",
  SQL: "SQL",
  COMPUTER_NETWORKS: "Computer Networks",
  OOP: "Object-Oriented Programming",
  SOFTWARE_ENGINEERING: "Software Engineering",
  COMPUTER_ARCHITECTURE: "Computer Architecture",
  ALGORITHMS: "Algorithms",
  DATA_STRUCTURES: "Data Structures",
};

export default async function CompetenciesPage() {
  const nodes = await db.competencyNode.findMany({
    where: { isActive: true },
    orderBy: [{ subject: "asc" }, { sortOrder: "asc" }],
    include: {
      prerequisites: { select: { id: true, title: true } },
      _count: { select: { questions: { where: { isActive: true, validationStatus: "APPROVED" } } } },
    },
  });

  const bySubject = nodes.reduce((acc, node) => {
    if (!acc[node.subject]) acc[node.subject] = [];
    acc[node.subject].push(node);
    return acc;
  }, {} as Record<Subject, typeof nodes>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Competencies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          CS fundamentals competency tree — each node has questions across all cognitive levels
        </p>
      </div>

      {Object.entries(bySubject).map(([subject, subjectNodes]) => (
        <section key={subject}>
          <h2 className="text-base font-semibold text-foreground mb-3">
            {SUBJECT_LABELS[subject as Subject] ?? subject}
          </h2>

          {/* Group by domain */}
          {groupByDomain(subjectNodes).map(([domain, domainNodes]) => (
            <div key={domain} className="mb-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {domain}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {domainNodes.map((node) => (
                  <Link
                    key={node.id}
                    href={`/competencies/${node.id}`}
                    className="group rounded-lg border bg-card p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary truncate">
                          {node.title}
                        </p>
                        {node.subSkill && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {node.skill} › {node.subSkill}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          node.difficulty === "ADVANCED"
                            ? "warning"
                            : node.difficulty === "INTERMEDIATE"
                            ? "default"
                            : "secondary"
                        }
                        className="flex-shrink-0 text-xs"
                      >
                        {difficultyLabel(node.difficulty)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{node._count.questions} questions</span>
                      {node.prerequisites.length > 0 && (
                        <span>{node.prerequisites.length} prerequisite{node.prerequisites.length !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}

      {nodes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No competencies available yet.
        </p>
      )}
    </div>
  );
}

function groupByDomain<T extends { domain: string }>(nodes: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const node of nodes) {
    if (!map.has(node.domain)) map.set(node.domain, []);
    map.get(node.domain)!.push(node);
  }
  return Array.from(map.entries());
}
