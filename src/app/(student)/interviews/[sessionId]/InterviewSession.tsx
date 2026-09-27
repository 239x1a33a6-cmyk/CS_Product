"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Turn = {
  id: string;
  turnIndex: number;
  questionText: string;
  studentResponse: string;
  scoreRaw: number | null;
  evaluationNotes: string | null;
  branchCondition: string | null;
};

type Question = {
  id: string;
  questionText: string;
  estimatedMinutes?: number;
};

type Props = {
  sessionId: string;
  scriptTitle: string;
  status: string;
  initialTurns: Turn[];
  currentQuestion: Question | null;
  totalNodes: number;
};

function parseFeedback(evaluationNotes: string | null) {
  if (!evaluationNotes) return null;
  try {
    return JSON.parse(evaluationNotes) as {
      strengths?: string;
      gaps?: string;
      suggestedRemediation?: string;
      note?: string;
    };
  } catch {
    return null;
  }
}

function ScoreBar({ scoreRaw }: { scoreRaw: number }) {
  const pct = Math.round(scoreRaw * 100);
  const color =
    pct >= 75
      ? "bg-emerald-500"
      : pct >= 40
      ? "bg-amber-500"
      : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

export function InterviewSession({
  sessionId,
  scriptTitle,
  status: initialStatus,
  initialTurns,
  currentQuestion: initialQuestion,
  totalNodes,
}: Props) {
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
    initialQuestion
  );
  const [status, setStatus] = useState(initialStatus);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const isComplete = status === "COMPLETED" || status === "ABANDONED";
  const completedTurns = turns.length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  async function handleSubmit() {
    if (!response.trim() || !currentQuestion || submitting) return;
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/interviews/${sessionId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: response.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Submission failed");
        return;
      }

      const { turn, nextQuestion, isComplete: done } = data.data;

      // Add completed turn to history
      const completedTurn: Turn = {
        id: turn.id,
        turnIndex: turn.turnIndex,
        questionText: currentQuestion.questionText,
        studentResponse: response.trim(),
        scoreRaw: turn.scoreRaw,
        evaluationNotes: JSON.stringify(turn.feedback),
        branchCondition: turn.branchCondition,
      };

      setTurns((prev) => [...prev, completedTurn]);
      setResponse("");
      setCurrentQuestion(nextQuestion);
      if (done) setStatus("COMPLETED");
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-xs text-muted-foreground mb-1">
            <Link href="/interviews" className="hover:text-foreground">
              Interviews
            </Link>
            {" / "}
            <span className="text-foreground">{scriptTitle}</span>
          </nav>
          <h1 className="text-xl font-semibold text-foreground">{scriptTitle}</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {completedTurns} / {totalNodes} questions
          </p>
          <Badge
            variant={
              status === "COMPLETED"
                ? "success"
                : status === "IN_PROGRESS"
                ? "default"
                : "muted"
            }
            className="text-xs mt-1"
          >
            {status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      {/* Turn history */}
      {turns.length > 0 && (
        <div className="space-y-4">
          {turns.map((turn) => {
            const feedback = parseFeedback(turn.evaluationNotes);
            return (
              <div key={turn.id} className="space-y-2">
                {/* Question */}
                <div className="rounded-lg bg-secondary/50 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Q{turn.turnIndex + 1}
                  </p>
                  <p className="text-sm text-foreground">{turn.questionText}</p>
                </div>
                {/* Student response */}
                <div className="ml-4 rounded-lg border bg-card px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Your answer
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {turn.studentResponse}
                  </p>
                </div>
                {/* Feedback */}
                {(turn.scoreRaw !== null || feedback) && (
                  <div className="ml-4 rounded-lg border border-border/60 bg-card/50 px-4 py-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Feedback
                    </p>
                    {turn.scoreRaw !== null && (
                      <ScoreBar scoreRaw={turn.scoreRaw} />
                    )}
                    {feedback?.note && (
                      <p className="text-xs text-muted-foreground">{feedback.note}</p>
                    )}
                    {feedback?.strengths && (
                      <div>
                        <p className="text-xs font-medium text-emerald-600 mb-0.5">
                          Strengths
                        </p>
                        <p className="text-xs text-foreground">{feedback.strengths}</p>
                      </div>
                    )}
                    {feedback?.gaps && (
                      <div>
                        <p className="text-xs font-medium text-amber-600 mb-0.5">
                          Gaps
                        </p>
                        <p className="text-xs text-foreground">{feedback.gaps}</p>
                      </div>
                    )}
                    {turn.branchCondition && (
                      <Badge
                        variant={
                          turn.branchCondition === "STRONG"
                            ? "success"
                            : turn.branchCondition === "PARTIAL"
                            ? "warning"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {turn.branchCondition}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Current question / completion */}
      {isComplete ? (
        <div className="rounded-lg border bg-card p-6 text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">Interview Complete</p>
          <p className="text-sm text-muted-foreground">
            You answered {completedTurns} question{completedTurns !== 1 ? "s" : ""}.
            {turns.length > 0 &&
              turns[turns.length - 1].scoreRaw !== null &&
              ` Final score: ${Math.round((turns[turns.length - 1].scoreRaw ?? 0) * 100)}%.`}
          </p>
          <Button asChild>
            <Link href="/interviews">Back to Interviews</Link>
          </Button>
        </div>
      ) : currentQuestion ? (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Q{turns.length + 1}
              {currentQuestion.estimatedMinutes && (
                <span className="ml-1">· ~{currentQuestion.estimatedMinutes} min</span>
              )}
            </p>
            <p className="text-sm font-medium text-foreground">
              {currentQuestion.questionText}
            </p>
          </div>
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            rows={5}
            placeholder="Type your answer here…"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            disabled={submitting}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleSubmit();
            }}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              ⌘ + Enter to submit
            </p>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !response.trim()}
              size="sm"
            >
              {submitting ? "Evaluating…" : "Submit Answer"}
            </Button>
          </div>
        </div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
