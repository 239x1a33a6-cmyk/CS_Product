import { db } from "@/db/client";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { QuestionForm } from "../QuestionForm";

export default async function NewQuestionPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/mentor/cohort");

  const competencyNodes = await db.competencyNode.findMany({
    where: { isActive: true },
    select: { id: true, title: true, subject: true, domain: true },
    orderBy: [{ subject: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Add Question</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Questions start as DRAFT — approve them to make them available in assessments
        </p>
      </div>
      <QuestionForm competencyNodes={competencyNodes} />
    </div>
  );
}
