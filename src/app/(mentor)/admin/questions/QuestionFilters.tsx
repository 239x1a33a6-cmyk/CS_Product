"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type CompetencyNodeOption = { id: string; title: string; subject: string };

const COGNITIVE_LEVELS = ["RECALL", "UNDERSTANDING", "APPLICATION", "REASONING", "DEFENSIBILITY"];
const STATUSES = ["DRAFT", "REVIEWED", "APPROVED", "DEPRECATED"];

export function QuestionFilters({
  competencyNodes,
}: {
  competencyNodes: CompetencyNodeOption[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/admin/questions?${params.toString()}`);
    },
    [sp, router]
  );

  return (
    <div className="flex flex-wrap gap-2">
      <input
        type="text"
        placeholder="Search questions…"
        defaultValue={sp.get("q") ?? ""}
        className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-52"
        onChange={(e) => setParam("q", e.target.value)}
      />
      <select
        className="rounded-md border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        value={sp.get("nodeId") ?? ""}
        onChange={(e) => setParam("nodeId", e.target.value)}
      >
        <option value="">All competencies</option>
        {competencyNodes.map((n) => (
          <option key={n.id} value={n.id}>
            {n.title}
          </option>
        ))}
      </select>
      <select
        className="rounded-md border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        value={sp.get("cognitiveLevel") ?? ""}
        onChange={(e) => setParam("cognitiveLevel", e.target.value)}
      >
        <option value="">All levels</option>
        {COGNITIVE_LEVELS.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
      <select
        className="rounded-md border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        value={sp.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
