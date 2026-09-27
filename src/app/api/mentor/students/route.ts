import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { requireMentor } from "@/lib/auth/session";
import { withErrorHandler, apiResponse } from "@/lib/validation";

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const session = await requireMentor();

  const mentorProfile = await db.mentorProfile.findUnique({
    where: { userId: session.user.id },
    include: { cohorts: { select: { id: true } } },
  });

  const cohortIds = mentorProfile?.cohorts.map((c) => c.id) ?? [];

  // For admin, show all students
  const isAdmin = session.user.role === "ADMIN";

  const students = await db.studentProfile.findMany({
    where: isAdmin ? {} : { cohortId: { in: cohortIds } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      cohort: { select: { id: true, name: true } },
      masteryStates: {
        include: {
          competencyNode: { select: { id: true, title: true, subject: true, difficulty: true } },
        },
        orderBy: { computedAt: "desc" },
      },
      _count: {
        select: {
          attempts: true,
          assessments: true,
          interviewSessions: true,
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Identify students needing attention:
  // - Has competencies with no evidence (never assessed)
  // - Has WEAK quality evidence at UNDERSTANDING+ levels
  // - Has pending evaluations waiting for mentor review
  const pendingReviews = await db.attempt.groupBy({
    by: ["studentId"],
    where: {
      evaluationStatus: { in: ["AI_EVALUATED", "PENDING_MENTOR"] },
      studentId: { in: students.map((s) => s.id) },
    },
    _count: { id: true },
  });
  const pendingMap = Object.fromEntries(
    pendingReviews.map((p) => [p.studentId, p._count.id])
  );

  const enriched = students.map((s) => ({
    ...s,
    pendingReviewCount: pendingMap[s.id] ?? 0,
    needsAttention:
      (pendingMap[s.id] ?? 0) > 0 ||
      s.masteryStates.some(
        (ms) =>
          (ms.understandingScore !== null && ms.understandingScore < 0.5) ||
          (ms.applicationScore !== null && ms.applicationScore < 0.5)
      ),
  }));

  return apiResponse({ students: enriched });
});
