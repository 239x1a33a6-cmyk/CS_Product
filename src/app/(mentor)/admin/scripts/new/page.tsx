import { db } from "@/db/client";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { ScriptBuilder } from "./ScriptBuilder";

export default async function NewScriptPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/mentor/cohort");

  const competencyNodes = await db.competencyNode.findMany({
    where: { isActive: true },
    select: { id: true, title: true, subject: true, domain: true },
    orderBy: [{ subject: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">New Interview Script</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build a branching interview with STRONG / PARTIAL / WEAK routing
        </p>
      </div>
      <ScriptBuilder competencyNodes={competencyNodes} />
    </div>
  );
}
