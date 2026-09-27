"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const SUBJECTS = [
  { value: "OPERATING_SYSTEMS", label: "Operating Systems" },
  { value: "DBMS", label: "DBMS" },
  { value: "SQL", label: "SQL" },
  { value: "COMPUTER_NETWORKS", label: "Computer Networks" },
  { value: "OOP", label: "OOP" },
  { value: "SOFTWARE_ENGINEERING", label: "Software Engineering" },
  { value: "COMPUTER_ARCHITECTURE", label: "Computer Architecture" },
  { value: "ALGORITHMS", label: "Algorithms" },
  { value: "DATA_STRUCTURES", label: "Data Structures" },
];

const DIFFICULTIES = [
  { value: "FOUNDATIONAL", label: "Foundational" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

type InitialData = {
  id: string;
  subject: string;
  domain: string;
  skill: string;
  subSkill: string;
  title: string;
  description: string;
  learningObjective: string;
  difficulty: string;
  misconceptions: string[];
  tags: string[];
  sortOrder: number;
};

export function CompetencyNodeForm({ initialData }: { initialData?: InitialData }) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [subject, setSubject] = useState(initialData?.subject ?? "");
  const [domain, setDomain] = useState(initialData?.domain ?? "");
  const [skill, setSkill] = useState(initialData?.skill ?? "");
  const [subSkill, setSubSkill] = useState(initialData?.subSkill ?? "");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [learningObjective, setLearningObjective] = useState(
    initialData?.learningObjective ?? ""
  );
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? "FOUNDATIONAL");
  const [misconceptionsText, setMisconceptionsText] = useState(
    (initialData?.misconceptions ?? []).join("\n")
  );
  const [tagsText, setTagsText] = useState((initialData?.tags ?? []).join(", "));
  const [sortOrder, setSortOrder] = useState(String(initialData?.sortOrder ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!subject) { setError("Subject is required"); return; }
    if (!domain.trim()) { setError("Domain is required"); return; }
    if (!skill.trim()) { setError("Skill is required"); return; }
    if (!title.trim()) { setError("Title is required"); return; }
    if (!description.trim()) { setError("Description is required"); return; }
    if (!learningObjective.trim()) { setError("Learning objective is required"); return; }

    setSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/competencies/${initialData!.id}`
        : "/api/admin/competencies";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          domain,
          skill,
          subSkill: subSkill || undefined,
          title,
          description,
          learningObjective,
          difficulty,
          misconceptions: misconceptionsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          tags: tagsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          sortOrder: parseInt(sortOrder) || 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? "Save failed");
        return;
      }

      router.push("/admin/competencies");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider";

  return (
    <div className="space-y-5 rounded-lg border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Subject *</label>
          <select
            className={inputClass}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">Select subject…</option>
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Difficulty *</label>
          <select
            className={inputClass}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Domain *</label>
          <input
            className={inputClass}
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. Processes & Threads"
          />
        </div>
        <div>
          <label className={labelClass}>Skill *</label>
          <input
            className={inputClass}
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="e.g. Process Concepts"
          />
        </div>
        <div>
          <label className={labelClass}>Sub-skill</label>
          <input
            className={inputClass}
            value={subSkill}
            onChange={(e) => setSubSkill(e.target.value)}
            placeholder="e.g. Process States"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Title *</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short descriptive title"
        />
      </div>

      <div>
        <label className={labelClass}>Description *</label>
        <textarea
          className={inputClass + " min-h-[80px] resize-y"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this competency covers"
        />
      </div>

      <div>
        <label className={labelClass}>Learning Objective *</label>
        <textarea
          className={inputClass + " min-h-[60px] resize-y"}
          value={learningObjective}
          onChange={(e) => setLearningObjective(e.target.value)}
          placeholder="What a student should be able to do"
        />
      </div>

      <div>
        <label className={labelClass}>
          Common Misconceptions{" "}
          <span className="normal-case font-normal">(one per line)</span>
        </label>
        <textarea
          className={inputClass + " min-h-[80px] resize-y font-mono text-xs"}
          value={misconceptionsText}
          onChange={(e) => setMisconceptionsText(e.target.value)}
          placeholder="Students often think that..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            Tags <span className="normal-case font-normal">(comma separated)</span>
          </label>
          <input
            className={inputClass}
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="e.g. memory, scheduling, concurrency"
          />
        </div>
        <div>
          <label className={labelClass}>Sort Order</label>
          <input
            type="number"
            className={inputClass}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            min={0}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Node"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/competencies")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
