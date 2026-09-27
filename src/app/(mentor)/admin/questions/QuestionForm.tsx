"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type CompetencyNodeOption = { id: string; title: string; subject: string; domain: string };

const QUESTION_TYPES = [
  "MCQ", "MULTI_SELECT", "SHORT_ANSWER", "EXPLAIN",
  "SCENARIO", "REASONING", "COMPARE_CONTRAST", "DEBUG",
];
const COGNITIVE_LEVELS = ["RECALL", "UNDERSTANDING", "APPLICATION", "REASONING", "DEFENSIBILITY"];
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const STATUSES = ["DRAFT", "REVIEWED", "APPROVED", "DEPRECATED"];

type MCQOption = { id: string; text: string; isCorrect: boolean };

type InitialData = {
  id: string;
  competencyNodeId: string;
  questionText: string;
  questionType: string;
  cognitiveLevel: string;
  difficulty: string;
  options: MCQOption[] | null;
  correctAnswer: string | null;
  referenceAnswer: string | null;
  explanation: string;
  scenarioContext: string | null;
  misconceptionTargeted: string | null;
  rubric: { criteria: Array<{ name: string; description?: string; weight: number }> } | null;
  estimatedMinutes: number;
  validationStatus: string;
  isActive: boolean;
};

export function QuestionForm({
  competencyNodes,
  initialData,
}: {
  competencyNodes: CompetencyNodeOption[];
  initialData?: InitialData;
}) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [competencyNodeId, setCompetencyNodeId] = useState(initialData?.competencyNodeId ?? "");
  const [questionText, setQuestionText] = useState(initialData?.questionText ?? "");
  const [questionType, setQuestionType] = useState(initialData?.questionType ?? "EXPLAIN");
  const [cognitiveLevel, setCognitiveLevel] = useState(initialData?.cognitiveLevel ?? "UNDERSTANDING");
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? "MEDIUM");
  const [referenceAnswer, setReferenceAnswer] = useState(initialData?.referenceAnswer ?? "");
  const [explanation, setExplanation] = useState(initialData?.explanation ?? "");
  const [scenarioContext, setScenarioContext] = useState(initialData?.scenarioContext ?? "");
  const [misconceptionTargeted, setMisconceptionTargeted] = useState(initialData?.misconceptionTargeted ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(initialData?.estimatedMinutes ?? 3);
  const [validationStatus, setValidationStatus] = useState(initialData?.validationStatus ?? "DRAFT");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [options, setOptions] = useState<MCQOption[]>(
    initialData?.options ?? [
      { id: "a", text: "", isCorrect: false },
      { id: "b", text: "", isCorrect: false },
      { id: "c", text: "", isCorrect: false },
      { id: "d", text: "", isCorrect: false },
    ]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isMCQ = questionType === "MCQ" || questionType === "MULTI_SELECT";

  function updateOption(idx: number, patch: Partial<MCQOption>) {
    setOptions((prev) => prev.map((o, i) => i === idx ? { ...o, ...patch } : o));
  }

  function toggleCorrect(idx: number) {
    if (questionType === "MCQ") {
      // Single correct — deselect others
      setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
    } else {
      updateOption(idx, { isCorrect: !options[idx].isCorrect });
    }
  }

  async function handleSave() {
    setError("");
    if (!competencyNodeId) { setError("Competency is required"); return; }
    if (!questionText.trim()) { setError("Question text is required"); return; }
    if (!explanation.trim()) { setError("Explanation is required"); return; }

    const payload: Record<string, unknown> = {
      competencyNodeId,
      questionText,
      questionType,
      cognitiveLevel,
      difficulty,
      referenceAnswer: referenceAnswer || undefined,
      explanation,
      scenarioContext: scenarioContext || undefined,
      misconceptionTargeted: misconceptionTargeted || undefined,
      estimatedMinutes,
      validationStatus,
    };

    if (isMCQ) {
      payload.options = options.filter((o) => o.text.trim());
      const correctOption = options.find((o) => o.isCorrect);
      payload.correctAnswer = correctOption?.id;
    }

    if (isEdit) {
      payload.isActive = isActive;
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/questions/${initialData!.id}` : "/api/admin/questions";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? "Save failed");
        return;
      }

      router.push("/admin/questions");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Competency + metadata */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Competency Node *
          </label>
          <select
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            value={competencyNodeId}
            onChange={(e) => setCompetencyNodeId(e.target.value)}
          >
            <option value="">Select competency…</option>
            {competencyNodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.subject.replace(/_/g, " ")} — {n.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Type
            </label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cognitive level
            </label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={cognitiveLevel}
              onChange={(e) => setCognitiveLevel(e.target.value)}
            >
              {COGNITIVE_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Difficulty
            </label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Question content */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Question Text *
          </label>
          <textarea
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            rows={3}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="What is…? Explain how…? Compare and contrast…?"
          />
        </div>

        {scenarioContext !== undefined && (questionType === "SCENARIO" || scenarioContext) && (
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Scenario Context
            </label>
            <textarea
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              rows={2}
              value={scenarioContext}
              onChange={(e) => setScenarioContext(e.target.value)}
              placeholder="A web server receives 1000 concurrent requests…"
            />
          </div>
        )}

        {/* MCQ Options */}
        {isMCQ && (
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Options (check correct answer{questionType === "MULTI_SELECT" ? "s" : ""})
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type={questionType === "MULTI_SELECT" ? "checkbox" : "radio"}
                    checked={opt.isCorrect}
                    onChange={() => toggleCorrect(idx)}
                    className="flex-shrink-0"
                  />
                  <span className="text-xs text-muted-foreground w-5">{opt.id}.</span>
                  <input
                    className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    value={opt.text}
                    onChange={(e) => updateOption(idx, { text: e.target.value })}
                    placeholder={`Option ${opt.id}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reference answer */}
        {!isMCQ && (
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Reference Answer (shown to mentor, used by AI)
            </label>
            <textarea
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              rows={4}
              value={referenceAnswer}
              onChange={(e) => setReferenceAnswer(e.target.value)}
              placeholder="Full model answer…"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Explanation * (shown to student after attempt)
          </label>
          <textarea
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            rows={3}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Why this answer is correct and what concept it tests…"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Misconception targeted
            </label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={misconceptionTargeted}
              onChange={(e) => setMisconceptionTargeted(e.target.value)}
              placeholder="Which misconception does this expose?"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Estimated minutes
            </label>
            <input
              type="number"
              min={1}
              max={30}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 3)}
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Validation Status
            </label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={validationStatus}
              onChange={(e) => setValidationStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer mt-4">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Only <strong>APPROVED</strong> questions appear in student assessments.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Question"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/questions")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
