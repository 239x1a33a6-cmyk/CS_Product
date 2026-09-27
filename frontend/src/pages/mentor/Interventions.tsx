import { useEffect, useState } from "react";
import api from "../../lib/api";

const STATUS_ORDER = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const NEXT_STATUS: Record<string, string> = { PENDING: "IN_PROGRESS", IN_PROGRESS: "COMPLETED" };

export default function MentorInterventionsPage() {
  const [interventions, setInterventions] = useState<any[]>([]);

  async function load() {
    api.get("/mentor/interventions").then((r) => setInterventions(r.data.data.interventions));
  }

  useEffect(() => { load(); }, []);

  async function advance(id: string, status: string) {
    await api.patch(`/mentor/interventions/${id}`, { status });
    load();
  }

  const grouped = STATUS_ORDER.reduce<Record<string, any[]>>((acc, s) => {
    acc[s] = interventions.filter((i) => i.status === s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Interventions</h1>

      {["PENDING", "IN_PROGRESS"].map((status) => (
        grouped[status].length > 0 && (
          <div key={status}>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{status.replace("_", " ")}</h2>
            <div className="divide-y divide-gray-200 rounded-lg border bg-white">
              {grouped[status].map((i) => (
                <div key={i.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{i.student?.user?.name}</p>
                    <p className="text-xs text-gray-500">{i.competencyNode?.title} · {i.type.replace(/_/g, " ")}</p>
                    {i.notes && <p className="text-xs text-gray-400 italic">{i.notes}</p>}
                  </div>
                  {NEXT_STATUS[status] && (
                    <button onClick={() => advance(i.id, NEXT_STATUS[status])}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700">
                      Mark {NEXT_STATUS[status].replace("_", " ")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {grouped["COMPLETED"].length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">COMPLETED</h2>
          <div className="divide-y divide-gray-200 rounded-lg border bg-white opacity-70">
            {grouped["COMPLETED"].map((i) => (
              <div key={i.id} className="px-4 py-3">
                <p className="text-sm text-gray-700">{i.student?.user?.name} · {i.competencyNode?.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
