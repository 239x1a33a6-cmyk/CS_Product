import { db } from "@/db/client";
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { QuestionForm } from "../QuestionForm";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/mentor/cohort");

  const { id } = await params;

  const [question, competencyNodes] = await Promise.all([
    db.question.findUnique({
      where: { id },
      select: {
        id: true,
        competencyNodeId: true,
        questionText: true,
        questionType: true,
        cognitiveLevel: true,
        difficulty: true,
        options: true,
        correctAnswer: true,
        referenceAnswer: true,
        explanation: true,
        scenarioContext: true,
        misconceptionTargeted: true,
        rubric: true,
        estimatedMinutes: true,
        validationStatus: true,
        isActive: true,
        _count: { select: { attempts: true } },
      },
    }),
    db.competencyNode.findMany({
      where: { isActive: true },
      select: { id: true, title: true, subject: true, domain: true },
      orderBy: [{ subject: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  if (!question) notFound();

  type MCQOption = { id: string; text: string; isCorrect: boolean };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Edit Question</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {question._count.attempts} attempt{question._count.attempts !== 1 ? "s" : ""} recorded
        </p>
      </div>
      <QuestionForm
        competencyNodes={competencyNodes}
        initialData={{
          id: question.id,
          competencyNodeId: question.competencyNodeId,
          questionText: question.questionText,
          questionType: question.questionType,
          cognitiveLevel: question.cognitiveLevel,
          difficulty: question.difficulty,
          options: question.options as MCQOption[] | null,
          correctAnswer: question.correctAnswer,
          referenceAnswer: question.referenceAnswer,
          explanation: question.explanation,
          scenarioContext: question.scenarioContext,
          misconceptionTargeted: question.misconceptionTargeted,
          rubric: question.rubric as { criteria: Array<{ name: string; description?: string; weight: number }> } | null,
          estimatedMinutes: question.estimatedMinutes,
          validationStatus: question.validationStatus,
          isActive: question.isActive,
        }}
      />
    </div>
  );
}
