import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { getUser } from "../lib/auth";

export default function DashboardPage() {
  const user = getUser();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    api.get("/assessments").then((r) => setAssessments(r.data.data.assessments ?? [])).catch(() => {});
    api.get("/interviews").then((r) => setSessions(r.data.data.sessions ?? [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{user?.role}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Assessments</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{assessments.length}</p>
          <Link to="/assessments" className="text-xs text-indigo-600 hover:underline mt-2 block">View all →</Link>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Interviews</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{sessions.length}</p>
          <Link to="/interviews" className="text-xs text-indigo-600 hover:underline mt-2 block">View all →</Link>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Completed</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {sessions.filter((s) => s.status === "COMPLETED").length}
          </p>
        </div>
      </div>
    </div>
  );
}
