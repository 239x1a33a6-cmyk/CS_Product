import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function InterviewsPage() {
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    api.get("/interviews").then((r) => {
      setScripts(r.data.data.scripts ?? []);
      setSessions(r.data.data.sessions ?? []);
    });
  }, []);

  async function startSession(scriptId: string) {
    setStarting(scriptId);
    try {
      const { data } = await api.post("/interviews", { scriptId });
      navigate(`/interviews/${data.data.session.id}`);
    } finally {
      setStarting(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Interviews</h1>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Available Scripts</h2>
        {scripts.length === 0 ? <p className="text-sm text-gray-500">No scripts available.</p> : (
          <div className="divide-y divide-gray-200 rounded-lg border bg-white">
            {scripts.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.title}</p>
                  <p className="text-xs text-gray-500">{s.competencyNode?.title} · {s.competencyNode?.subject?.replace(/_/g, " ")}</p>
                </div>
                <button onClick={() => startSession(s.id)} disabled={starting === s.id}
                  className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {starting === s.id ? "Starting…" : "Start"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {sessions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">My Sessions</h2>
          <div className="divide-y divide-gray-200 rounded-lg border bg-white">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.script?.title}</p>
                  <p className="text-xs text-gray-500">
                    <span className={s.status === "COMPLETED" ? "text-green-600" : "text-amber-600"}>{s.status}</span>
                    {s.overallScore !== null && ` · ${Math.round(s.overallScore * 100)}%`}
                  </p>
                </div>
                {s.status === "IN_PROGRESS" && (
                  <a href={`/interviews/${s.id}`} className="text-xs text-indigo-600 hover:underline">Continue →</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
