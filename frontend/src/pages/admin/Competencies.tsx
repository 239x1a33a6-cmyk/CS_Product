import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function AdminCompetenciesPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});

  useEffect(() => {
    api.get("/admin/competencies").then((r) => {
      const list = r.data.data.nodes;
      setNodes(list);
      const g: Record<string, any[]> = {};
      for (const n of list) {
        if (!g[n.subject]) g[n.subject] = [];
        g[n.subject].push(n);
      }
      setGrouped(g);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Competency Nodes <span className="text-gray-400 text-lg font-normal">({nodes.length})</span></h1>

      {Object.entries(grouped).map(([subject, nodes]) => (
        <div key={subject}>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {subject.replace(/_/g, " ")}
          </h2>
          <div className="divide-y divide-gray-200 rounded-lg border bg-white">
            {nodes.map((n) => (
              <div key={n.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.domain} › {n.skill}{n.subSkill ? ` › ${n.subSkill}` : ""}</p>
                  <p className="text-xs text-gray-400">{n._count?.questions ?? 0} questions · {n._count?.masteryStates ?? 0} students tracked</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${n.difficulty === "FOUNDATIONAL" ? "bg-green-100 text-green-700" : n.difficulty === "INTERMEDIATE" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {n.difficulty}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
