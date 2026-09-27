"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const NEXT_STATUS: Record<string, string> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

const LABEL: Record<string, string> = {
  IN_PROGRESS: "Start",
  COMPLETED: "Complete",
};

export function InterventionStatusForm({
  interventionId,
  currentStatus,
}: {
  interventionId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const nextStatus = NEXT_STATUS[currentStatus];

  if (!nextStatus) return null;

  async function advance() {
    setLoading(true);
    try {
      await fetch("/api/mentor/interventions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interventionId, status: nextStatus }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={advance} disabled={loading}>
      {loading ? "…" : LABEL[nextStatus] ?? nextStatus}
    </Button>
  );
}
