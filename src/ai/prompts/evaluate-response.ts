// Versioned prompt for open-ended answer evaluation
// Version history matters: AI_FIRST_PASS feedback records which version generated it

export const EVALUATE_RESPONSE_VERSION = "v1.0";

export function buildEvaluationPrompt(params: {
  questionText: string;
  questionType: string;
  cognitiveLevel: string;
  referenceAnswer?: string;
  rubric?: unknown;
  studentResponse: string;
  competencyTitle: string;
  misconceptionTargeted?: string;
}): string {
  const rubricText = params.rubric
    ? `\nRubric: ${JSON.stringify(params.rubric, null, 2)}`
    : "";

  const referenceText = params.referenceAnswer
    ? `\nReference answer: ${params.referenceAnswer}`
    : "";

  const misconceptionText = params.misconceptionTargeted
    ? `\nThis question is designed to surface this misconception: "${params.misconceptionTargeted}"`
    : "";

  return `You are evaluating a CS student's answer for placement readiness. Be precise, honest, and educationally useful.

Competency: ${params.competencyTitle}
Cognitive level being assessed: ${params.cognitiveLevel}
Question type: ${params.questionType}
Question: ${params.questionText}${referenceText}${rubricText}${misconceptionText}

Student's response:
"""
${params.studentResponse}
"""

Evaluate this response and return ONLY valid JSON matching this exact structure:
{
  "strengths": "What the student demonstrated correctly (be specific, 1-3 sentences)",
  "gaps": "What is missing, incomplete, or incorrect (be specific, educationally useful)",
  "misconceptionsFound": ["list", "of", "specific", "misconceptions", "if any"],
  "suggestedRemediation": "Concrete next step for this student (1-2 sentences)",
  "scoreRaw": 0.0
}

scoreRaw must be a float between 0.0 (completely wrong/missing) and 1.0 (complete, accurate, well-reasoned).
For ${params.cognitiveLevel} level: score on whether the student actually demonstrates that cognitive level, not just surface accuracy.
If the student merely restated the question or gave a trivially short answer, score no higher than 0.2.
Do not be lenient. A score above 0.8 means the student genuinely demonstrated strong ${params.cognitiveLevel}-level understanding.
Return only the JSON object, no preamble, no markdown.`;
}
