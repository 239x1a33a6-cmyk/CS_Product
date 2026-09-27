import { auth } from "@/lib/auth/config";
import { db } from "@/db/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function InterviewsPage() {
  const session = await auth();

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session!.user.id },
  });

  const [scripts, sessions] = await Promise.all([
    db.interviewScript.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        competencyNode: { select: { title: true, subject: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    studentProfile
      ? db.interviewSession.findMany({
          where: { studentId: studentProfile.id },
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            script: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Interviews</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Practice interview simulations with branching questions
        </p>
      </div>

      {/* Available scripts */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          Available Interviews
        </h2>
        {scripts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No interviews are available yet.
          </p>
        ) : (
          <div className="space-y-2">
            {scripts.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.competencyNode.subject.replace(/_/g, " ")} ·{" "}
                    {s.competencyNode.title}
                  </p>
                  {s.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-sm">
                      {s.description}
                    </p>
                  )}
                </div>
                <Button asChild size="sm">
                  <Link href={`/interviews/start?scriptId=${s.id}`}>
                    Start
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            Your Sessions
          </h2>
          <div className="divide-y divide-border rounded-lg border">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm text-foreground">
                    {s.script?.title ?? "Unknown script"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.startedAt
                      ? new Date(s.startedAt).toLocaleDateString("en-IN")
                      : "Not started"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      s.status === "COMPLETED"
                        ? "success"
                        : s.status === "IN_PROGRESS"
                        ? "default"
                        : s.status === "ABANDONED"
                        ? "destructive"
                        : "muted"
                    }
                  >
                    {s.status.replace(/_/g, " ")}
                  </Badge>
                  {(s.status === "IN_PROGRESS" || s.status === "COMPLETED") && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/interviews/${s.id}`}>
                        {s.status === "IN_PROGRESS" ? "Continue" : "Review"}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
