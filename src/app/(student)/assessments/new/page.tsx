"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cognitiveLabel } from "@/lib/utils";

type Question = {
  id: string;
  competencyNodeId: string;
  questionText: string;
  questionType: string;
  cognitiveLevel: string;
  difficulty: string;
  options: Array<{ id: string; text: string }> | null;
  scenarioContext: string | null;
  estimatedMinutes: number;
  rubric: { criteria: Array<{ name: string }> } | null;
};

function AssessmentFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nodeId = searchParams.get("nodeId");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [response, setResponse] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean | null;
    scoreRaw: number | null;
    feedback: {
      strengths: string;
      gaps: string;
      suggestedRemediation: string;
      scoreRaw: number;
      pendingMentorReview: boolean;
    } | null;
    correctAnswer: { correctId: string; explanation: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!nodeId) return;
    startAssessment();
  }, [nodeId]);

  async function startAssessment() {
    setLoading(true);
    // Create assessment
    const createRes = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PRACTICE",
        competencyNodeIds: [nodeId],
      }),
    });

    if (!createRes.ok) {
      setError("Failed to start assessment");
      setLoading(false);
      return;
    }

    const { data } = await createRes.json();
    const aId = data.assessment.id;
    setAssessmentId(aId);

    // Fetch questions
    const qRes = await fetch(`/api/assessments/${aId}/questions`);
    if (!qRes.ok) {
      setError("Failed to load questions");
      setLoading(false);
      return;
    }

    const { data: qData } = await qRes.json();
    setQuestions(qData.questions);
    setLoading(false);
  }

  const question = questions[currentIdx];
  const isMultiSelect = question?.questionType === "MULTI_SELECT";
  const isMCQ = question?.questionType === "MCQ";
  const isObjective = isMCQ || isMultiSelect;

  function toggleSelect(id: string) {
    if (isMultiSelect) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
      );
    } else {
      setSelected([id]);
    }
  }

  async function submitAnswer() {
    if (!question || submitting) return;
    const answerValue = isObjective ? selected.join(",") : response;
    if (!answerValue.trim()) return;

    setSubmitting(true);
    const res = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessmentId,
        questionId: question.id,
        response: answerValue,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError("Failed to submit answer");
      return;
    }

    const { data } = await res.json();
    setFeedback(data);
  }

  function nextQuestion() {
    if (currentIdx + 1 >= questions.length) {
      setCompleted(true);
      return;
    }
    setCurrentIdx((i) => i + 1);
    setResponse("");
    setSelected([]);
    setFeedback(null);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-muted-foreground text-sm">Loading assessment…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-destructive text-sm">{error}</p>
        <Button onClick={() => router.back()} variant="ghost" className="mt-4">
          Go back
        </Button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Assessment complete
        </h2>
        <p className="text-sm text-muted-foreground">
          Your responses have been recorded. Your mastery evidence has been updated.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => router.push("/progress")}>
            View Progress
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/competencies")}
          >
            More Competencies
          </Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No approved questions available for this competency yet.
        </p>
        <Button onClick={() => router.back()} variant="ghost" className="mt-4">
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Question {currentIdx + 1} of {questions.length}
        </p>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full ${
                i < currentIdx
                  ? "bg-primary"
                  : i === currentIdx
                  ? "bg-primary/50"
                  : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        {/* Level badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium level-${question.cognitiveLevel.toLowerCase()}`}
          >
            {cognitiveLabel(question.cognitiveLevel)}
          </span>
          <span className="text-xs text-muted-foreground">
            {question.questionType.replace(/_/g, " ")}
          </span>
        </div>

        {/* Scenario context */}
        {question.scenarioContext && (
          <div className="rounded-md bg-secondary p-3 text-sm text-foreground">
            <p className="font-medium text-xs text-muted-foreground mb-1">
              Scenario
            </p>
            {question.scenarioContext}
          </div>
        )}

        {/* Question text */}
        <p className="text-base text-foreground leading-relaxed">
          {question.questionText}
        </p>

        {/* Answer input */}
        {!feedback && (
          <>
            {isObjective && question.options ? (
              <div className="space-y-2">
                {question.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleSelect(opt.id)}
                    className={`w-full text-left rounded-md border px-4 py-3 text-sm transition-colors ${
                      selected.includes(opt.id)
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/50"
                    }`}
                  >
                    {opt.text}
                  </button>
                ))}
                {isMultiSelect && (
                  <p className="text-xs text-muted-foreground">
                    Select all that apply
                  </p>
                )}
              </div>
            ) : (
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write your answer here…"
                rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                ~{question.estimatedMinutes} min
              </span>
              <Button
                onClick={submitAnswer}
                disabled={
                  submitting ||
                  (isObjective ? selected.length === 0 : response.trim().length < 10)
                }
              >
                {submitting ? "Submitting…" : "Submit Answer"}
              </Button>
            </div>
          </>
        )}

        {/* Feedback */}
        {feedback && (
          <div className="space-y-4 pt-2 border-t">
            {feedback.correctAnswer && (
              <div
                className={`rounded-md p-3 text-sm ${
                  feedback.isCorrect
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                <p className="font-medium mb-1">
                  {feedback.isCorrect ? "Correct" : "Not quite"}
                </p>
                <p>{feedback.correctAnswer.explanation}</p>
              </div>
            )}

            {feedback.feedback && (
              <div className="space-y-3">
                {feedback.feedback.pendingMentorReview && (
                  <p className="text-xs text-muted-foreground bg-secondary rounded-md px-3 py-2">
                    AI first-pass feedback — a mentor will review this evaluation
                  </p>
                )}
                {feedback.feedback.strengths && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Strengths
                    </p>
                    <p className="text-sm text-foreground">
                      {feedback.feedback.strengths}
                    </p>
                  </div>
                )}
                {feedback.feedback.gaps && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Gaps
                    </p>
                    <p className="text-sm text-foreground">
                      {feedback.feedback.gaps}
                    </p>
                  </div>
                )}
                {feedback.feedback.suggestedRemediation && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Next step
                    </p>
                    <p className="text-sm text-foreground">
                      {feedback.feedback.suggestedRemediation}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={nextQuestion}>
                {currentIdx + 1 >= questions.length
                  ? "Finish Assessment"
                  : "Next Question"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewAssessmentPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Loading…</div>}>
      <AssessmentFlow />
    </Suspense>
  );
}
