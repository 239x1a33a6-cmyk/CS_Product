import { db } from "@/db/client";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { CohortForm } from "../CohortForm";

export default async function NewCohortPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/mentor/cohort");

  const mentors = await db.user.findMany({
    where: { isActive: true, role: { in: ["MENTOR", "ADMIN"] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">New Cohort</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a cohort and assign a mentor
        </p>
      </div>
      <CohortForm mentors={mentors} />
    </div>
  );
}
