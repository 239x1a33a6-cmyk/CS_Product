"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type MentorOption = { id: string; name: string; email: string; role: string };

export function CohortForm({
  mentors,
  initialData,
}: {
  mentors: MentorOption[];
  initialData?: {
    id: string;
    name: string;
    description?: string;
    mentorUserId: string;
    isActive: boolean;
    startDate?: string;
    endDate?: string;
  };
}) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [mentorUserId, setMentorUserId] = useState(initialData?.mentorUserId ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [startDate, setStartDate] = useState(initialData?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialData?.endDate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!name.trim()) { setError("Name is required"); return; }
    if (!mentorUserId) { setError("Mentor is required"); return; }

    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/cohorts/${initialData!.id}` : "/api/admin/cohorts";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          mentorUserId,
          isActive,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? "Save failed");
        return;
      }

      router.push("/admin/cohorts");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 rounded-lg border bg-card p-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Cohort Name *
        </label>
        <input
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Batch 2025 A"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Description
        </label>
        <input
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Mentor *
        </label>
        <select
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          value={mentorUserId}
          onChange={(e) => setMentorUserId(e.target.value)}
        >
          <option value="">Select mentor…</option>
          {mentors.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.email}) {m.role === "ADMIN" ? "— Admin" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Start Date
          </label>
          <input
            type="date"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            End Date
          </label>
          <input
            type="date"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active cohort
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Cohort"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/cohorts")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
