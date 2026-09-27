import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function AdminCohortsPage() {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", mentorUserId: "", description: "" });
  const [error, setError] = useState("");

  async function load() {
    const [c, u] = await Promise.all([
      api.get("/admin/cohorts"),
      api.get("/users?role=MENTOR"),
    ]);
    setCohorts(c.data.data.cohorts);
    setMentors(u.data.data.users);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/admin/cohorts", form);
      setForm({ name: "", mentorUserId: "", description: "" });
      load();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Cohorts</h1>

      <form onSubmit={handleCreate} className="bg-white rounded-lg border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">New Cohort</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm" />
          <select required value={form.mentorUserId} onChange={(e) => setForm({ ...form, mentorUserId: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm">
            <option value="">Select mentor…</option>
            {mentors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm" />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm">Create</button>
      </form>

      <div className="divide-y divide-gray-200 rounded-lg border bg-white">
        {cohorts.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{c.name}</p>
              <p className="text-xs text-gray-500">Mentor: {c.mentor?.user?.name} · {c._count?.students ?? 0} students</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {c.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
