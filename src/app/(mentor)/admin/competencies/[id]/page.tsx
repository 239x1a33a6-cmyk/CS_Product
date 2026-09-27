import { db } from "@/db/client";
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CompetencyNodeForm } from "../CompetencyNodeForm";

export default async function EditCompetencyNodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/mentor/cohort");

  const { id } = await params;

  const node = await db.competencyNode.findUnique({ where: { id } });
  if (!node) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/competencies" className="hover:text-foreground">
          Competencies
        </Link>
        <span>/</span>
        <span className="text-foreground">{node.title}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Edit Node</h1>
        <p className="text-sm text-muted-foreground mt-1">{node.title}</p>
      </div>

      <CompetencyNodeForm
        initialData={{
          id: node.id,
          subject: node.subject,
          domain: node.domain,
          skill: node.skill,
          subSkill: node.subSkill ?? "",
          title: node.title,
          description: node.description,
          learningObjective: node.learningObjective,
          difficulty: node.difficulty,
          misconceptions: node.misconceptions,
          tags: node.tags,
          sortOrder: node.sortOrder,
        }}
      />
    </div>
  );
}
