import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { CompetencyNodeForm } from "../CompetencyNodeForm";

export default async function NewCompetencyNodePage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/mentor/cohort");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">New Competency Node</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define a skill node in the competency graph
        </p>
      </div>
      <CompetencyNodeForm />
    </div>
  );
}
