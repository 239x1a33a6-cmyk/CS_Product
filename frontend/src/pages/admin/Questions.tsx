import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [filter, setFilter] = useState({ nodeId: "", status: "", cognitiveLevel: "" });

  async function load() {
    const params = new URLSearchParams();
    if (filter.nodeId) params.set("nodeId", filter.nodeId);
    if (filter.status) params.set("status", filter.status);
    if (filter.cognitiveLevel) params.set("cognitiveLevel", filter.cognitiveLevel);
    const [q, n] = await Promise.all([
      api.get(`/admin/questions?${params}`),
      api.get("/admin/competencies"),
    ]);
    setQuestions(q.data.data.questions);
    setNodes(n.data.data.nodes);
  }

  useEffect(() => { load(); }, [filter]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Question Bank</h1>

      <div className="flex gap-3 flex-wrap">
        <select value={filter.nodeId} onChange={(e) => setFilter({ ...filter, nodeId: e.target.value })}
          className="border rounded-md px-3 py-1.5 text-sm">
          <option value="">All nodes</option>
          {nodes.map((n: any) => <option key={n.id} value={n.id}>{n.title}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="border rounded-md px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          {["DRAFT","REVIEW","APPROVED","DEPRECATED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.cognitiveLevel} onChange={(e) => setFilter({ ...filter, cognitiveLevel: e.target.value })}
          className="border rounded-md px-3 py-1.5 text-sm">
          <option value="">All levels</option>
          {["RECALL","UNDERSTANDING","APPLICATION","REASONING","DEFENSIBILITY"].map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div className="divide-y divide-gray-200 rounded-lg border bg-white">
        {questions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">No questions found.</p>
        ) : questions.map((q) => (
          <div key={q.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-gray-900">{q.stem}</p>
              <div className="flex gap-1.5 shrink-0">
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{q.cognitiveLevel}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${q.validationStatus === "APPROVED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{q.validationStatus}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{q.competencyNode?.title} · {q.type} · {q._count?.attempts ?? 0} attempts</p>
          </div>
        ))}
      </div>
    </div>
  );
}
