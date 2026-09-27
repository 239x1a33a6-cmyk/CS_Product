// AI Service interface — all AI calls route through here
// This boundary allows swapping providers without touching domain logic

export type AIFeedbackRequest = {
  questionText: string;
  questionType: string;
  cognitiveLevel: string;
  referenceAnswer?: string;
  rubric?: unknown;
  studentResponse: string;
  competencyTitle: string;
  misconceptionTargeted?: string;
};

export type AIFeedbackResult = {
  strengths: string;
  gaps: string;
  misconceptionsFound: string[];
  suggestedRemediation: string;
  scoreRaw: number; // 0.0–1.0, mentor can override
  modelVersion: string;
  promptVersion: string;
};

export type AISocraticRequest = {
  competencyTitle: string;
  studentResponse: string;
  previousExchange?: string;
};

export type AISocraticResult = {
  followUpQuestion: string;
  modelVersion: string;
};

export type AIExplanationRequest = {
  competencyTitle: string;
  competencyDescription: string;
  misconceptions: string[];
  level: "foundational" | "intermediate" | "advanced";
};

export type AIExplanationResult = {
  explanation: string;
  modelVersion: string;
  promptVersion: string;
};

export interface IAIService {
  evaluateResponse(req: AIFeedbackRequest): Promise<AIFeedbackResult>;
  generateSocraticFollowUp(req: AISocraticRequest): Promise<AISocraticResult>;
  generateExplanation(req: AIExplanationRequest): Promise<AIExplanationResult>;
}
