import { db } from "@/db/client";
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CohortForm } from "../CohortForm";
import { StudentAssignment } from "./StudentAssignment";

export default async function CohortDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/mentor/cohort");

  const { id } = await params;

  const [cohort, mentors, allStudents] = await Promise.all([
    db.cohort.findUnique({
      where: { id },
      include: {
        mentor: { include: { user: { select: { id: true, name: true, email: true } } } },
        students: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            _count: { select: { attempts: true } },
          },
          orderBy: { enrolledAt: "desc" },
        },
      },
    }),
    db.user.findMany({
      where: { isActive: true, role: { in: ["MENTOR", "ADMIN"] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { isActive: true, role: "STUDENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!cohort) notFound();

  return (
    <div className="max-w-4xl space-y-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/cohorts" className="hover:text-foreground">
          Cohorts
        </Link>
        <span>/</span>
        <span className="text-foreground">{cohort.name}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">{cohort.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cohort.students.length} student{cohort.students.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Edit cohort settings */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Settings</h2>
        <CohortForm
          mentors={mentors}
          initialData={{
            id: cohort.id,
            name: cohort.name,
            description: cohort.description ?? undefined,
            mentorUserId: cohort.mentor.user.id,
            isActive: cohort.isActive,
            startDate: cohort.startDate?.toISOString().split("T")[0],
            endDate: cohort.endDate?.toISOString().split("T")[0],
          }}
        />
      </div>

      {/* Student assignment */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Students</h2>
        <StudentAssignment
          cohortId={id}
          enrolledStudents={cohort.students.map((s) => ({
            id: s.id,
            userId: s.user.id,
            name: s.user.name,
            email: s.user.email,
            attemptCount: s._count.attempts,
          }))}
          allStudents={allStudents}
        />
      </div>
    </div>
  );
}
