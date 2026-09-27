import { auth } from "@/lib/auth/config";
import { db } from "@/db/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AssessmentsPage() {
  const session = await auth();

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session!.user.id },
  });

  const assessments = studentProfile
    ? await db.assessment.findMany({
        where: { studentId: studentProfile.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          competencyNodes: {
            include: { competencyNode: { select: { title: true } } },
          },
          _count: { select: { attempts: true } },
        },
      })
    : [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Assessments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your assessment history and active sessions
          </p>
        </div>
        <Button asChild>
          <Link href="/competencies">Start New</Link>
        </Button>
      </div>

      {assessments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No assessments yet. Start one from a competency node.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/competencies">Browse Competencies</Link>
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {assessments.map((a) => {
            const nodeNames = a.competencyNodes
              .map((n) => n.competencyNode.title)
              .join(", ");
            return (
              <div key={a.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate max-w-xs">
                      {nodeNames || "Assessment"}
                    </p>
                    <Badge
                      variant={
                        a.type === "DIAGNOSTIC"
                          ? "secondary"
                          : a.type === "PRACTICE"
                          ? "default"
                          : a.type === "CHECKPOINT"
                          ? "warning"
                          : "muted"
                      }
                      className="text-xs"
                    >
                      {a.type}
                    </Badge>
                    <Badge
                      variant={
                        a.status === "COMPLETED"
                          ? "success"
                          : a.status === "IN_PROGRESS"
                          ? "default"
                          : a.status === "ABANDONED"
                          ? "destructive"
                          : "muted"
                      }
                      className="text-xs"
                    >
                      {a.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a._count.attempts} attempt{a._count.attempts !== 1 ? "s" : ""} ·{" "}
                    {new Date(a.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(a.status === "IN_PROGRESS" || a.status === "PENDING") && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/assessments/new?nodeId=${a.competencyNodes[0]?.competencyNode ? encodeURIComponent("") : ""}&assessmentId=${a.id}`}>
                        Continue
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/assessments/${a.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
