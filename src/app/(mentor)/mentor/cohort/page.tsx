import { auth } from "@/lib/auth/config";
import { db } from "@/db/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cognitiveLabel, scoreToPercent } from "@/lib/utils";
import type { CognitiveLevel } from "@prisma/client";

export default async function CohortPage() {
  const session = await auth();
  const isAdmin = session!.user.role === "ADMIN";

  const mentorProfile = isAdmin
    ? null
    : await db.mentorProfile.findUnique({
        where: { userId: session!.user.id },
        include: { cohorts: { select: { id: true } } },
      });

  const cohortIds = mentorProfile?.cohorts.map((c) => c.id) ?? [];

  const students = await db.studentProfile.findMany({
    where: isAdmin ? {} : { cohortId: { in: cohortIds } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      cohort: { select: { id: true, name: true } },
      masteryStates: {
        include: {
          competencyNode: { select: { title: true, subject: true } },
        },
      },
      _count: { select: { attempts: true, interventions: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Identify students needing attention
  const pendingByStudent = await db.attempt.groupBy({
    by: ["studentId"],
    where: {
      evaluationStatus: { in: ["AI_EVALUATED", "PENDING_MENTOR"] },
      studentId: { in: students.map((s) => s.id) },
    },
    _count: { id: true },
  });
  const pendingMap = Object.fromEntries(
    pendingByStudent.map((p) => [p.studentId, p._count.id])
  );

  const needsAttention = students.filter(
    (s) =>
      (pendingMap[s.id] ?? 0) > 0 ||
      s.masteryStates.some(
        (ms) =>
          (ms.understandingScore !== null && ms.understandingScore < 0.5) ||
          (ms.applicationScore !== null && ms.applicationScore < 0.5)
      )
  );
  const onTrack = students.filter((s) => !needsAttention.includes(s));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cohort</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {students.length} student{students.length !== 1 ? "s" : ""}
            {needsAttention.length > 0 && (
              <> · <span className="text-amber-600">{needsAttention.length} need attention</span></>
            )}
          </p>
        </div>
      </div>

      {needsAttention.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-amber-700 mb-3 uppercase tracking-wider">
            Needs Attention
          </h2>
          <div className="divide-y divide-border rounded-lg border border-amber-200 bg-amber-50/30">
            {needsAttention.map((s) => (
              <StudentRow
                key={s.id}
                student={s}
                pendingCount={pendingMap[s.id] ?? 0}
                highlight
              />
            ))}
          </div>
        </section>
      )}

      {onTrack.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            {needsAttention.length > 0 ? "On Track" : "All Students"}
          </h2>
          <div className="divide-y divide-border rounded-lg border">
            {onTrack.map((s) => (
              <StudentRow
                key={s.id}
                student={s}
                pendingCount={pendingMap[s.id] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      {students.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No students in your cohort yet.
          </p>
        </div>
      )}
    </div>
  );
}

function StudentRow({
  student,
  pendingCount,
  highlight,
}: {
  student: {
    id: string;
    user: { name: string; email: string };
    cohort: { name: string } | null;
    masteryStates: Array<{
      recallScore: number | null;
      understandingScore: number | null;
      applicationScore: number | null;
      reasoningScore: number | null;
    }>;
    _count: { attempts: number; interventions: number };
  };
  pendingCount: number;
  highlight?: boolean;
}) {
  // Compute aggregate weakness signal
  const weakUnderstanding = student.masteryStates.some(
    (ms) => ms.understandingScore !== null && ms.understandingScore < 0.5
  );
  const weakApplication = student.masteryStates.some(
    (ms) => ms.applicationScore !== null && ms.applicationScore < 0.5
  );

  return (
    <div className={`px-4 py-3 ${highlight ? "bg-amber-50/20" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/mentor/students/${student.id}`}
            className="text-sm font-medium text-foreground hover:text-primary"
          >
            {student.user.name}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">
            {student.user.email}
            {student.cohort && <> · {student.cohort.name}</>}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {pendingCount > 0 && (
              <Badge variant="warning" className="text-xs">
                {pendingCount} pending review
              </Badge>
            )}
            {weakUnderstanding && (
              <Badge variant="destructive" className="text-xs">
                Weak Understanding
              </Badge>
            )}
            {weakApplication && (
              <Badge variant="destructive" className="text-xs">
                Weak Application
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground flex-shrink-0">
          <p>{student._count.attempts} attempts</p>
          <p>{student.masteryStates.length} competencies</p>
        </div>
      </div>
    </div>
  );
}
