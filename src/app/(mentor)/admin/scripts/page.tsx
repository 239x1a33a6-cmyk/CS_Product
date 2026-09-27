import { db } from "@/db/client";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ScriptsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/mentor/cohort");

  const scripts = await db.interviewScript.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      isActive: true,
      version: true,
      createdAt: true,
      competencyNode: { select: { title: true, subject: true } },
      _count: { select: { sessions: true } },
    },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Interview Scripts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Branching interview scripts for student simulation sessions
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/scripts/new">New Script</Link>
        </Button>
      </div>

      {scripts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">No scripts yet.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/scripts/new">Create your first script</Link>
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {scripts.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <Badge variant={s.isActive ? "success" : "muted"} className="text-xs">
                    {s.isActive ? "Active" : "Draft"}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">v{s.version}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.competencyNode.subject.replace(/_/g, " ")} ·{" "}
                  {s.competencyNode.title} ·{" "}
                  {s._count.sessions} session{s._count.sessions !== 1 ? "s" : ""}
                </p>
                {s.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-lg">
                    {s.description}
                  </p>
                )}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/scripts/${s.id}`}>Edit</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
