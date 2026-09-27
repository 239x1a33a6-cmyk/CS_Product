import { auth } from "@/lib/auth/config";
import { db } from "@/db/client";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cognitiveLabel, difficultyLabel } from "@/lib/utils";

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session!.user.id },
  });

  if (!studentProfile) redirect("/dashboard");

  const assessment = await db.assessment.findUnique({
    where: { id },
    include: {
      competencyNodes: {
        include: { competencyNode: { select: { id: true, title: true, subject: true } } },
      },
      attempts: {
        orderBy: { createdAt: "asc" },
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              questionType: true,
              cognitiveLevel: true,
              difficulty: true,
              explanation: true,
            },
          },
          evaluationFeedback: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!assessment) notFound();
  if (assessment.studentId !== studentProfile.id) redirect("/assessments");

  const competencyTitles = assessment.competencyNodes
    .map((n) => n.competencyNode.title)
    .join(", ");

  return (
    <div className="max-w-3xl space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/assessments" className="hover:text-foreground">
          Assessments
        </Link>
        <span>/</span>
        <span className="text-foreground">{assessment.type}</span>
      </nav>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge variant="secondary">{assessment.type}</Badge>
          <Badge
            variant={
              assessment.status === "COMPLETED"
                ? "success"
                : assessment.status === "IN_PROGRESS"
                ? "default"
                : "muted"
            }
          >
            {assessment.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          {competencyTitles || "Assessment"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {assessment.attempts.length} attempt{assessment.attempts.length !== 1 ? "s" : ""} ·{" "}
          Started {new Date(assessment.createdAt).toLocaleDateString("en-IN")}
          {assessment.completedAt &&
            ` · Completed ${new Date(assessment.completedAt).toLocaleDateString("en-IN")}`}
        </p>
      </div>

      {/* Attempts */}
      {assessment.attempts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">No attempts recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assessment.attempts.map((attempt, idx) => {
            const feedback = attempt.evaluationFeedback[0];
            const score = feedback?.scoreAdjusted ?? attempt.scoreRaw;

            return (
              <div key={attempt.id} className="rounded-lg border bg-card">
                {/* Question header */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                        <Badge variant="muted" className="text-xs">
                          {cognitiveLabel(attempt.question.cognitiveLevel)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {attempt.question.questionType.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {difficultyLabel(attempt.question.difficulty)}
                        </Badge>
                        {feedback && (
                          <Badge
                            variant={
                              feedback.feedbackSource === "MENTOR_REVIEWED"
                                ? "success"
                                : "warning"
                            }
                            className="text-xs"
                          >
                            {feedback.feedbackSource === "MENTOR_REVIEWED"
                              ? "Mentor Reviewed"
                              : "AI Feedback"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground">
                        {attempt.question.questionText}
                      </p>
                    </div>
                    {score !== null && (
                      <div className="text-right flex-shrink-0">
                        <span
                          className={`text-lg font-semibold ${
                            score >= 0.7
                              ? "text-emerald-600"
                              : score >= 0.4
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {Math.round(score * 100)}%
                        </span>
                        {attempt.isCorrect !== null && (
                          <p className="text-xs text-muted-foreground">
                            {attempt.isCorrect ? "Correct" : "Incorrect"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Student response */}
                <div className="px-4 py-3 border-b bg-secondary/20">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Your response
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {attempt.response}
                  </p>
                </div>

                {/* Feedback */}
                {feedback && (
                  <div className="px-4 py-3 space-y-2">
                    {feedback.strengths && (
                      <div>
                        <p className="text-xs font-medium text-emerald-600 mb-0.5">
                          Strengths
                        </p>
                        <p className="text-sm text-foreground">{feedback.strengths}</p>
                      </div>
                    )}
                    {feedback.gaps && (
                      <div>
                        <p className="text-xs font-medium text-amber-600 mb-0.5">
                          Gaps
                        </p>
                        <p className="text-sm text-foreground">{feedback.gaps}</p>
                      </div>
                    )}
                    {feedback.suggestedRemediation && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">
                          Suggested next step
                        </p>
                        <p className="text-sm text-foreground">
                          {feedback.suggestedRemediation}
                        </p>
                      </div>
                    )}
                    {feedback.feedbackSource === "AI_FIRST_PASS" && (
                      <p className="text-xs text-muted-foreground mt-2">
                        AI first-pass · pending mentor review
                      </p>
                    )}
                  </div>
                )}

                {/* Explanation (always shown) */}
                <div className="px-4 py-3 border-t bg-secondary/10">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    Explanation
                  </p>
                  <p className="text-sm text-foreground">
                    {attempt.question.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
