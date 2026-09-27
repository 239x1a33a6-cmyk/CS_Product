import { db } from "@/db/client";
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { ScriptBuilder } from "../new/ScriptBuilder";
import type { ScriptGraph } from "@/domain/interview/types";

export default async function EditScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/mentor/cohort");

  const { id } = await params;

  const [script, competencyNodes] = await Promise.all([
    db.interviewScript.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        competencyNodeId: true,
        isActive: true,
        scriptGraph: true,
        version: true,
        _count: { select: { sessions: true } },
      },
    }),
    db.competencyNode.findMany({
      where: { isActive: true },
      select: { id: true, title: true, subject: true, domain: true },
      orderBy: [{ subject: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  if (!script) notFound();

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Edit Script</h1>
        <p className="text-sm text-muted-foreground mt-1">
          v{script.version} · {script._count.sessions} session
          {script._count.sessions !== 1 ? "s" : ""}
        </p>
      </div>
      <ScriptBuilder
        competencyNodes={competencyNodes}
        initialData={{
          id: script.id,
          title: script.title,
          description: script.description ?? undefined,
          competencyNodeId: script.competencyNodeId,
          isActive: script.isActive,
          scriptGraph: script.scriptGraph as unknown as ScriptGraph,
        }}
      />
    </div>
  );
}
