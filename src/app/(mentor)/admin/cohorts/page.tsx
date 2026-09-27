import { db } from "@/db/client";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CohortsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/mentor/cohort");

  const cohorts = await db.cohort.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      mentor: {
        include: { user: { select: { name: true, email: true } } },
      },
      _count: { select: { students: true } },
    },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cohorts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage student cohort assignments
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cohorts/new">New Cohort</Link>
        </Button>
      </div>

      {cohorts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No cohorts yet.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/cohorts/new">Create first cohort</Link>
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {cohorts.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <Badge variant={c.isActive ? "success" : "muted"} className="text-xs">
                    {c.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mentor: {c.mentor.user.name} ·{" "}
                  {c._count.students} student{c._count.students !== 1 ? "s" : ""}
                  {c.startDate &&
                    ` · ${new Date(c.startDate).toLocaleDateString("en-IN")}`}
                </p>
                {c.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                )}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/cohorts/${c.id}`}>Manage</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
