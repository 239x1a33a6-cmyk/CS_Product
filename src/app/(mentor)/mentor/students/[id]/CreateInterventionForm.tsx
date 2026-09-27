"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  studentProfileId: string;
  competencyNodes: Array<{ id: string; title: string; subject: string }>;
};

export function CreateInterventionForm({ studentProfileId, competencyNodes }: Props) {
  const [form, setForm] = useState({
    type: "REMEDIATION" as const,
    competencyNodeId: "",
    rationale: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/interventions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentProfileId,
        competencyNodeId: form.competencyNodeId || undefined,
        type: form.type,
        rationale: form.rationale,
        description: form.description,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message ?? "Failed to create intervention");
      return;
    }

    setSuccess(true);
    setForm({ type: "REMEDIATION", competencyNodeId: "", rationale: "", description: "" });
  }

  if (success) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm text-emerald-700">
          Intervention created and visible to the student.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-xs text-emerald-600 underline mt-1"
        >
          Create another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border bg-card p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Type
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="REMEDIATION">Remediation</option>
            <option value="REASSESSMENT_REQUEST">Reassessment Request</option>
            <option value="ADDITIONAL_PRACTICE">Additional Practice</option>
            <option value="NOTE">Note</option>
            <option value="MEETING">Meeting</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Competency (optional)
          </label>
          <select
            value={form.competencyNodeId}
            onChange={(e) =>
              setForm((f) => ({ ...f, competencyNodeId: e.target.value }))
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— General / no specific competency —</option>
            {competencyNodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Rationale
          <span className="text-muted-foreground font-normal ml-1">
            (what evidence triggered this?)
          </span>
        </label>
        <textarea
          required
          minLength={10}
          value={form.rationale}
          onChange={(e) => setForm((f) => ({ ...f, rationale: e.target.value }))}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          placeholder="e.g. Student scored below 40% on Application-level questions for Process States"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Action description
          <span className="text-muted-foreground font-normal ml-1">
            (what should the student do?)
          </span>
        </label>
        <textarea
          required
          minLength={10}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          placeholder="e.g. Re-read process states section, then attempt the scenario questions again"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create Intervention"}
        </Button>
      </div>
    </form>
  );
}
