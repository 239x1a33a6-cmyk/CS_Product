import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function AdminScriptsPage() {
  const [scripts, setScripts] = useState<any[]>([]);

  useEffect(() => {
    api.get("/admin/scripts").then((r) => setScripts(r.data.data.scripts));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Interview Scripts</h1>
      <div className="divide-y divide-gray-200 rounded-lg border bg-white">
        {scripts.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">No scripts yet.</p>
        ) : scripts.map((s) => (
          <div key={s.id} className="px-4 py-3">
            <p className="text-sm font-medium text-gray-900">{s.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {s.competencyNode?.title} · {s._count?.sessions ?? 0} sessions · v{s.version}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
