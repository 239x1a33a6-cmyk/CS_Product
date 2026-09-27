import { auth } from "@/lib/auth/config";
import { db } from "@/db/client";
import { Badge } from "@/components/ui/badge";
import { cognitiveLabel } from "@/lib/utils";
import Link from "next/link";
import { InterventionStatusForm } from "./InterventionStatusForm";

export default async function InterventionsPage() {
  const session = await auth();
  const isAdmin = session!.user.role === "ADMIN";

  const interventions = await db.intervention.findMany({
    where: isAdmin ? {} : { mentorId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      student: {
        include: { user: { select: { name: true, email: true } } },
      },
      competencyNode: { select: { id: true, title: true, subject: true } },
      mentor: { select: { name: true } },
    },
  });

  const byStatus = {
    PENDING: interventions.filter((i) => i.status === "PENDING"),
    IN_PROGRESS: interventions.filter((i) => i.status === "IN_PROGRESS"),
    COMPLETED: interventions.filter((i) => i.status === "COMPLETED"),
    CANCELLED: interventions.filter((i) => i.status === "CANCELLED"),
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Interventions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {interventions.length} intervention{interventions.length !== 1 ? "s" : ""} ·{" "}
          {byStatus.PENDING.length + byStatus.IN_PROGRESS.length} active
        </p>
      </div>

      {interventions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No interventions yet. Create them from a student&apos;s profile.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(["PENDING", "IN_PROGRESS"] as const).map((statusKey) => {
            const group = byStatus[statusKey];
            if (group.length === 0) return null;
            return (
              <section key={statusKey}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {statusKey.replace(/_/g, " ")} ({group.length})
                </h2>
                <div className="divide-y divide-border rounded-lg border">
                  {group.map((i) => (
                    <InterventionRow key={i.id} intervention={i} />
                  ))}
                </div>
              </section>
            );
          })}

          {byStatus.COMPLETED.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Completed ({byStatus.COMPLETED.length})
              </h2>
              <div className="divide-y divide-border rounded-lg border">
                {byStatus.COMPLETED.map((i) => (
                  <InterventionRow key={i.id} intervention={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function InterventionRow({
  intervention,
}: {
  intervention: {
    id: string;
    type: string;
    status: string;
    rationale: string;
    description: string;
    createdAt: Date;
    student: { id: string; user: { name: string; email: string } };
    competencyNode: { id: string; title: string; subject: string } | null;
    mentor: { name: string };
  };
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link
              href={`/mentor/students/${intervention.student.id}`}
              className="text-sm font-medium text-foreground hover:text-primary"
            >
              {intervention.student.user.name}
            </Link>
            <Badge variant="muted" className="text-xs">
              {intervention.type.replace(/_/g, " ")}
            </Badge>
            {intervention.competencyNode && (
              <span className="text-xs text-muted-foreground">
                {intervention.competencyNode.subject.replace(/_/g, " ")} ·{" "}
                {intervention.competencyNode.title}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{intervention.rationale}</p>
          {intervention.description && (
            <p className="text-xs text-foreground mt-0.5">{intervention.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {intervention.mentor.name} · {new Date(intervention.createdAt).toLocaleDateString("en-IN")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            variant={
              intervention.status === "COMPLETED"
                ? "success"
                : intervention.status === "IN_PROGRESS"
                ? "default"
                : intervention.status === "CANCELLED"
                ? "destructive"
                : "muted"
            }
          >
            {intervention.status.replace(/_/g, " ")}
          </Badge>
          <InterventionStatusForm
            interventionId={intervention.id}
            currentStatus={intervention.status}
          />
        </div>
      </div>
    </div>
  );
}
