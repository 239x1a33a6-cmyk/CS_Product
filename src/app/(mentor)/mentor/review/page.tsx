"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cognitiveLabel } from "@/lib/utils";

type PendingAttempt = {
  id: string;
  response: string;
  cognitiveLevel: string;
  evaluationStatus: string;
  createdAt: string;
  question: {
    questionText: string;
    questionType: string;
    cognitiveLevel: string;
    referenceAnswer: string | null;
    rubric: { criteria: Array<{ name: string; weight: number }> } | null;
    competencyNode: { title: string };
  };
  student: {
    user: { name: string; email: string };
  };
  evaluationFeedback: Array<{
    strengths: string | null;
    gaps: string | null;
    suggestedRemediation: string | null;
    scoreAdjusted: number | null;
    feedbackSource: string;
  }>;
};

export default function ReviewQueuePage() {
  const [attempts, setAttempts] = useState<PendingAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingAttempt | null>(null);
  const [review, setReview] = useState({
    scoreRaw: 0,
    strengths: "",
    gaps: "",
    suggestedRemediation: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/mentor/review")
      .then((r) => r.json())
      .then((d) => setAttempts(d.data?.attempts ?? []))
      .finally(() => setLoading(false));
  }, []);

  function selectAttempt(a: PendingAttempt) {
    setSelected(a);
    const lastFeedback = a.evaluationFeedback[0];
    if (lastFeedback) {
      setReview({
        scoreRaw: lastFeedback.scoreAdjusted ?? 0,
        strengths: lastFeedback.strengths ?? "",
        gaps: lastFeedback.gaps ?? "",
        suggestedRemediation: lastFeedback.suggestedRemediation ?? "",
      });
    } else {
      setReview({ scoreRaw: 0, strengths: "", gaps: "", suggestedRemediation: "" });
    }
  }

  async function submitReview() {
    if (!selected) return;
    setSubmitting(true);

    const res = await fetch("/api/mentor/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId: selected.id,
        scoreRaw: review.scoreRaw,
        strengths: review.strengths,
        gaps: review.gaps,
        suggestedRemediation: review.suggestedRemediation,
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      setSuccessIds((prev) => new Set([...prev, selected.id]));
      setAttempts((prev) => prev.filter((a) => a.id !== selected.id));
      setSelected(null);
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading review queue…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Review Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {attempts.length} attempt{attempts.length !== 1 ? "s" : ""} awaiting mentor evaluation
        </p>
      </div>

      {attempts.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No attempts pending review. All caught up.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Attempt list */}
        <div className="lg:col-span-2 space-y-2">
          {attempts.map((a) => (
            <button
              key={a.id}
              onClick={() => selectAttempt(a)}
              className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                selected?.id === a.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <p className="text-sm font-medium text-foreground">
                {a.student.user.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {a.question.competencyNode.title}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="muted" className="text-xs">
                  {cognitiveLabel(a.cognitiveLevel)}
                </Badge>
                {a.evaluationStatus === "AI_EVALUATED" && (
                  <Badge variant="warning" className="text-xs">
                    AI evaluated
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Review panel */}
        {selected && (
          <div className="lg:col-span-3 rounded-lg border bg-card p-6 space-y-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {selected.question.competencyNode.title} ·{" "}
                {cognitiveLabel(selected.cognitiveLevel)}
              </p>
              <p className="text-base text-foreground font-medium">
                {selected.question.questionText}
              </p>
            </div>

            {selected.question.referenceAnswer && (
              <div className="rounded-md bg-secondary p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Reference answer
                </p>
                <p className="text-sm text-foreground">
                  {selected.question.referenceAnswer}
                </p>
              </div>
            )}

            <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Student response — {selected.student.user.name}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {selected.response}
              </p>
            </div>

            {selected.evaluationFeedback[0]?.feedbackSource === "AI_FIRST_PASS" && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-medium text-amber-700 mb-1">
                  AI first-pass (edit before confirming)
                </p>
              </div>
            )}

            {/* Rubric */}
            {selected.question.rubric && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Rubric criteria
                </p>
                <ul className="space-y-1">
                  {selected.question.rubric.criteria.map((c) => (
                    <li key={c.name} className="text-xs text-foreground">
                      <span className="text-muted-foreground">
                        {Math.round(c.weight * 100)}%
                      </span>{" "}
                      {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Score slider */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Score: {Math.round(review.scoreRaw * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={review.scoreRaw}
                onChange={(e) =>
                  setReview((r) => ({
                    ...r,
                    scoreRaw: parseFloat(e.target.value),
                  }))
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>0% (No understanding)</span>
                <span>100% (Excellent)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Strengths
              </label>
              <textarea
                value={review.strengths}
                onChange={(e) =>
                  setReview((r) => ({ ...r, strengths: e.target.value }))
                }
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="What did they demonstrate well?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Gaps
              </label>
              <textarea
                value={review.gaps}
                onChange={(e) =>
                  setReview((r) => ({ ...r, gaps: e.target.value }))
                }
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="What is missing or incorrect?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Suggested next step
              </label>
              <textarea
                value={review.suggestedRemediation}
                onChange={(e) =>
                  setReview((r) => ({
                    ...r,
                    suggestedRemediation: e.target.value,
                  }))
                }
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="What should this student do next?"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setSelected(null)}
              >
                Cancel
              </Button>
              <Button onClick={submitReview} disabled={submitting}>
                {submitting ? "Saving…" : "Submit Review"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
