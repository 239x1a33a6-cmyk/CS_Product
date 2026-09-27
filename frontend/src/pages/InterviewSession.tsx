import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function InterviewSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [lastFeedback, setLastFeedback] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const { data } = await api.get(`/interviews/${id}`);
    setState(data.data);
  }

  useEffect(() => { load(); }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/interviews/${id}/respond`, { responseText: answer });
      const result = data.data;
      setLastFeedback(result);
      setAnswer("");
      if (result.isLast) {
        await load();
      } else {
        await load();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!state) return <p className="text-sm text-gray-500">Loading…</p>;

  const { session, currentNode } = state;
  const isDone = session?.status === "COMPLETED";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{session?.script?.title}</h1>
        {isDone && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Completed</span>}
      </div>

      {isDone ? (
        <div className="bg-white rounded-lg border p-6 text-center space-y-3">
          <p className="text-lg font-semibold text-gray-900">Interview Complete</p>
          {session.overallScore !== null && (
            <p className="text-3xl font-bold text-indigo-600">{Math.round(session.overallScore * 100)}%</p>
          )}
          <button onClick={() => navigate("/interviews")} className="text-sm text-indigo-600 hover:underline">
            Back to interviews
          </button>
        </div>
      ) : currentNode ? (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-5">
            <p className="text-sm font-medium text-gray-900 leading-relaxed">{currentNode.questionText}</p>
          </div>

          {lastFeedback && (
            <div className={`rounded-lg border p-4 text-sm space-y-1 ${lastFeedback.branchCondition === "STRONG" ? "bg-green-50 border-green-200" : lastFeedback.branchCondition === "PARTIAL" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
              <p className="font-medium">{lastFeedback.branchCondition}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={5}
              placeholder="Your answer…"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
            <button type="submit" disabled={submitting || !answer.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? "Evaluating…" : "Submit Answer"}
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No current question.</p>
      )}
    </div>
  );
}
