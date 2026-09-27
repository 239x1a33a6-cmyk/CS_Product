"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type EnrolledStudent = {
  id: string; // StudentProfile.id
  userId: string;
  name: string;
  email: string;
  attemptCount: number;
};

type UserOption = { id: string; name: string; email: string };

export function StudentAssignment({
  cohortId,
  enrolledStudents,
  allStudents,
}: {
  cohortId: string;
  enrolledStudents: EnrolledStudent[];
  allStudents: UserOption[];
}) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const enrolledUserIds = new Set(enrolledStudents.map((s) => s.userId));
  const unenrolled = allStudents.filter((u) => !enrolledUserIds.has(u.id));

  async function addStudent() {
    if (!selectedUserId) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cohorts/${cohortId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? "Failed to add student");
        return;
      }
      setSelectedUserId("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function removeStudent(studentProfileId: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cohorts/${cohortId}/students`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentProfileId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? "Failed to remove student");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Add student */}
      <div className="flex gap-2">
        <select
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="">
            {unenrolled.length === 0 ? "All students enrolled" : "Add a student…"}
          </option>
          {unenrolled.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — {u.email}
            </option>
          ))}
        </select>
        <Button
          onClick={addStudent}
          disabled={!selectedUserId || loading}
          size="sm"
        >
          Add
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Enrolled list */}
      {enrolledStudents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {enrolledStudents.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-sm text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.email} · {s.attemptCount} attempt{s.attemptCount !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeStudent(s.id)}
                disabled={loading}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
