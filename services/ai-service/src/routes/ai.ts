import { Router } from "express";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { ok } from "@cs-platform/shared";

const router = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-opus-5-5";

const EvaluateSchema = z.object({
  question: z.string(),
  studentAnswer: z.string(),
  evaluationHint: z.string().optional(),
  cognitiveLevel: z.string().optional(),
});

const FollowUpSchema = z.object({
  question: z.string(),
  studentAnswer: z.string(),
  scoreRaw: z.number(),
  gaps: z.array(z.string()),
});

const ExplainSchema = z.object({
  concept: z.string(),
  learningObjective: z.string().optional(),
});

router.post("/evaluate", async (req, res, next) => {
  try {
    const body = EvaluateSchema.parse(req.body);
    const prompt = `You are evaluating a CS student's answer in an interview simulation.

Question: ${body.question}
Cognitive level: ${body.cognitiveLevel ?? "UNDERSTANDING"}
Evaluation hint: ${body.evaluationHint ?? "N/A"}
Student's answer: ${body.studentAnswer}

Evaluate and respond with JSON only:
{
  "strengths": ["..."],
  "gaps": ["..."],
  "misconceptionsFound": ["..."],
  "suggestedRemediation": "...",
  "scoreRaw": 0.0
}
scoreRaw is 0.0–1.0. Be strict — DEFENSIBILITY level requires handling follow-up pressure.`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content.find((b) => b.type === "text")?.text ?? "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { strengths: [], gaps: [], misconceptionsFound: [], suggestedRemediation: "", scoreRaw: 0.3 };

    ok(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/followup", async (req, res, next) => {
  try {
    const body = FollowUpSchema.parse(req.body);
    const prompt = `Generate a Socratic follow-up question for a student who partially answered a CS interview question.

Original question: ${body.question}
Student answer: ${body.studentAnswer}
Score: ${body.scoreRaw}
Gaps identified: ${body.gaps.join("; ")}

Return one concise follow-up question that probes their understanding of the gaps. Plain text only.`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const followUp = message.content.find((b) => b.type === "text")?.text?.trim() ?? "";
    ok(res, { followUp });
  } catch (err) {
    next(err);
  }
});

router.post("/explain", async (req, res, next) => {
  try {
    const body = ExplainSchema.parse(req.body);
    const prompt = `Explain the following CS concept clearly for a student preparing for technical interviews.

Concept: ${body.concept}
Learning objective: ${body.learningObjective ?? "Understand fundamentals"}

Give a clear explanation (3-5 sentences), then one concrete example. Plain text.`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const explanation = message.content.find((b) => b.type === "text")?.text?.trim() ?? "";
    ok(res, { explanation });
  } catch (err) {
    next(err);
  }
});

export default router;
