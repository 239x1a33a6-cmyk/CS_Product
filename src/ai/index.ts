import { AnthropicAdapter } from "./AnthropicAdapter";
import type { IAIService } from "./AIService";

// Singleton — one instance per process
let _aiService: IAIService | null = null;

export function getAIService(): IAIService {
  if (!_aiService) {
    _aiService = new AnthropicAdapter();
  }
  return _aiService;
}

export type { IAIService } from "./AIService";
export type {
  AIFeedbackRequest,
  AIFeedbackResult,
  AISocraticRequest,
  AISocraticResult,
  AIExplanationRequest,
  AIExplanationResult,
} from "./AIService";
