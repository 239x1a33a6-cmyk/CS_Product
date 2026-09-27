import type { QuestionType, CognitiveLevel } from "@prisma/client";

type MCQOption = { id: string; text: string; isCorrect: boolean };

// Auto-score objective question types; returns null for open-ended
export function autoScore(
  questionType: QuestionType,
  options: MCQOption[] | null | undefined,
  correctAnswer: string | null | undefined,
  studentResponse: string
): { isCorrect: boolean; scoreRaw: number } | null {
  if (questionType === "MCQ") {
    const correct = options?.find((o) => o.isCorrect);
    if (!correct) return null;
    const isCorrect = studentResponse.trim() === correct.id;
    return { isCorrect, scoreRaw: isCorrect ? 1.0 : 0.0 };
  }

  if (questionType === "MULTI_SELECT") {
    const correctIds = options
      ?.filter((o) => o.isCorrect)
      .map((o) => o.id)
      .sort();
    if (!correctIds?.length) return null;
    const selectedIds = studentResponse
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .sort();
    const isExact =
      selectedIds.length === correctIds.length &&
      selectedIds.every((id, i) => id === correctIds[i]);
    if (isExact) return { isCorrect: true, scoreRaw: 1.0 };
    // Partial credit: proportion of correct selections
    const correctSelected = selectedIds.filter((id) =>
      correctIds.includes(id)
    ).length;
    const incorrectSelected = selectedIds.filter(
      (id) => !correctIds.includes(id)
    ).length;
    const score = Math.max(
      0,
      (correctSelected - incorrectSelected) / correctIds.length
    );
    return { isCorrect: false, scoreRaw: score };
  }

  // Open-ended types require AI or mentor evaluation
  return null;
}

export function isOpenEnded(questionType: QuestionType): boolean {
  return [
    "SHORT_ANSWER",
    "EXPLAIN",
    "SCENARIO",
    "REASONING",
    "COMPARE_CONTRAST",
    "DEBUG",
  ].includes(questionType);
}
