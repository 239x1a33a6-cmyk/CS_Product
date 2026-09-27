import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function MentorReviewPage() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get("/mentor/review").then((r) => setAttempts(r.data.data.attempts));
  }, []);

  async function handleOverride(attemptId: string) {
    const score = parseFloat(scores[attemptId]);
    if (isNaN(score)) return;
    setSubmitting(attemptId);
    try {
      await api.post("/mentor/review", { attemptId, scoreAdjusted: score });
      setAttempts((prev) => prev.filter((a) => a.id !== attemptId));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Review Queue</h1>
      {attempts.length === 0 ? (
        <p className="text-sm text-gray-500">No pending reviews.</p>
      ) : (
        <div className="space-y-4">
          {attempts.map((a) => {
            const fb = a.evaluationFeedback?.[0];
            return (
              <div key={a.id} className="bg-white rounded-lg border p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">{a.student?.user?.name} · {a.question?.cognitiveLevel}</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{a.question?.stem}</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded p-2 mt-2">{a.responseText}</p>
                </div>
                {fb && (
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium text-green-700">AI score: </span>{Math.round((fb.scoreAdjusted ?? a.scoreRaw) * 100)}%</p>
                    {fb.gaps?.length > 0 && <p><span className="font-medium text-amber-700">Gaps: </span>{fb.gaps.join(", ")}</p>}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input type="number" min={0} max={1} step={0.05} placeholder="Score 0–1"
                    value={scores[a.id] ?? ""} onChange={(e) => setScores({ ...scores, [a.id]: e.target.value })}
                    className="w-32 border rounded-md px-2 py-1 text-sm" />
                  <button onClick={() => handleOverride(a.id)} disabled={submitting === a.id}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50">
                    {submitting === a.id ? "Saving…" : "Override"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
