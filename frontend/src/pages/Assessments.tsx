import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/assessments").then((r) => setAssessments(r.data.data.assessments)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">My Assessments</h1>
      {assessments.length === 0 ? (
        <p className="text-sm text-gray-500">No assessments yet.</p>
      ) : (
        <div className="divide-y divide-gray-200 rounded-lg border bg-white">
          {assessments.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{a.type.replace("_", " ")}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {a._count?.attempts ?? 0} attempt{a._count?.attempts !== 1 ? "s" : ""} ·{" "}
                  <span className={a.status === "COMPLETED" ? "text-green-600" : "text-amber-600"}>{a.status}</span>
                </p>
              </div>
              <Link to={`/assessments/${a.id}`} className="text-xs text-indigo-600 hover:underline">View →</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
