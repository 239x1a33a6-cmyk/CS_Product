"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Creates a session and immediately redirects to it
export default function StartInterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scriptId = searchParams.get("scriptId");
  const started = useRef(false);

  useEffect(() => {
    if (!scriptId || started.current) return;
    started.current = true;

    fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scriptId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.session?.id) {
          router.replace(`/interviews/${data.data.session.id}`);
        } else {
          router.replace("/interviews");
        }
      })
      .catch(() => router.replace("/interviews"));
  }, [scriptId, router]);

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm text-muted-foreground">Starting interview…</p>
    </div>
  );
}
