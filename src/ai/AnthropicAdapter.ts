import Anthropic from "@anthropic-ai/sdk";
import type {
  IAIService,
  AIFeedbackRequest,
  AIFeedbackResult,
  AISocraticRequest,
  AISocraticResult,
  AIExplanationRequest,
  AIExplanationResult,
} from "./AIService";
import {
  buildEvaluationPrompt,
  EVALUATE_RESPONSE_VERSION,
} from "./prompts/evaluate-response";

const MODEL = "claude-opus-5-5";
const EXPLANATION_PROMPT_VERSION = "v1.0";

export class AnthropicAdapter implements IAIService {
  private client: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async evaluateResponse(req: AIFeedbackRequest): Promise<AIFeedbackResult> {
    const prompt = buildEvaluationPrompt(req);

    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let parsed: {
      strengths: string;
      gaps: string;
      misconceptionsFound: string[];
      suggestedRemediation: string;
      scoreRaw: number;
    };

    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`AI returned non-JSON response: ${text.slice(0, 200)}`);
    }

    // Validate and clamp score
    const score = Math.max(0, Math.min(1, Number(parsed.scoreRaw) || 0));

    return {
      strengths: String(parsed.strengths ?? ""),
      gaps: String(parsed.gaps ?? ""),
      misconceptionsFound: Array.isArray(parsed.misconceptionsFound)
        ? parsed.misconceptionsFound.map(String)
        : [],
      suggestedRemediation: String(parsed.suggestedRemediation ?? ""),
      scoreRaw: score,
      modelVersion: MODEL,
      promptVersion: EVALUATE_RESPONSE_VERSION,
    };
  }

  async generateSocraticFollowUp(
    req: AISocraticRequest
  ): Promise<AISocraticResult> {
    const prompt = `You are a Socratic interviewer helping a CS student deepen their understanding of "${req.competencyTitle}".

Student's response: "${req.studentResponse}"
${req.previousExchange ? `Previous exchange:\n${req.previousExchange}` : ""}

Generate ONE follow-up question that:
- Probes deeper into their reasoning (not just restating the question)
- Targets the weakest part of their response
- Sounds like a real interview follow-up
- Is concise (one sentence)

Return ONLY the question, no preamble.`;

    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    return { followUpQuestion: text, modelVersion: MODEL };
  }

  async generateExplanation(
    req: AIExplanationRequest
  ): Promise<AIExplanationResult> {
    const prompt = `You are writing a concise, accurate explanation of a CS concept for a B.Tech student preparing for placements.

Concept: ${req.competencyTitle}
Description: ${req.competencyDescription}
Level: ${req.level}
Common misconceptions to address: ${req.misconceptions.join("; ")}

Write a clear explanation (200-300 words) that:
1. Defines the concept accurately
2. Explains WHY it matters / how it works
3. Gives one concrete example
4. Addresses the listed misconceptions directly

Write for a student who has "studied" this but may not truly understand it. Do not use bullet points — write in connected paragraphs. Be precise, not fluffy.`;

    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    return {
      explanation: text,
      modelVersion: MODEL,
      promptVersion: EXPLANATION_PROMPT_VERSION,
    };
  }
}
