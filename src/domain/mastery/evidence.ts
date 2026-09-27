import type { MasteryEvidence, CognitiveLevel } from "@prisma/client";

// Evidence quality thresholds
const RECENCY_HALF_LIFE_DAYS = 30;

type EvidenceWithLevel = {
  cognitiveLevel: CognitiveLevel;
  quality: string;
  recordedAt: Date;
};

// Decay factor: evidence older than RECENCY_HALF_LIFE_DAYS contributes less
function recencyWeight(recordedAt: Date): number {
  const ageDays = (Date.now() - recordedAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp((-Math.LN2 * ageDays) / RECENCY_HALF_LIFE_DAYS);
}

function qualityToScore(quality: string): number {
  switch (quality) {
    case "STRONG": return 1.0;
    case "SOLID":  return 0.75;
    case "PARTIAL": return 0.5;
    case "WEAK":   return 0.2;
    default:       return 0;
  }
}

// Compute dimensional scores from raw evidence records
export function computeMasteryScores(evidence: EvidenceWithLevel[]): {
  recallScore: number | null;
  understandingScore: number | null;
  applicationScore: number | null;
  reasoningScore: number | null;
  defensibilityScore: number | null;
} {
  const byLevel: Record<string, { weightedSum: number; totalWeight: number }> = {
    RECALL:         { weightedSum: 0, totalWeight: 0 },
    UNDERSTANDING:  { weightedSum: 0, totalWeight: 0 },
    APPLICATION:    { weightedSum: 0, totalWeight: 0 },
    REASONING:      { weightedSum: 0, totalWeight: 0 },
    DEFENSIBILITY:  { weightedSum: 0, totalWeight: 0 },
  };

  for (const e of evidence) {
    const bucket = byLevel[e.cognitiveLevel];
    if (!bucket) continue;
    const weight = recencyWeight(e.recordedAt);
    const score = qualityToScore(e.quality);
    bucket.weightedSum += score * weight;
    bucket.totalWeight += weight;
  }

  function toScore(bucket: { weightedSum: number; totalWeight: number }) {
    if (bucket.totalWeight === 0) return null;
    return Math.min(1, bucket.weightedSum / bucket.totalWeight);
  }

  return {
    recallScore:        toScore(byLevel.RECALL),
    understandingScore: toScore(byLevel.UNDERSTANDING),
    applicationScore:   toScore(byLevel.APPLICATION),
    reasoningScore:     toScore(byLevel.REASONING),
    defensibilityScore: toScore(byLevel.DEFENSIBILITY),
  };
}

// Map a raw attempt score (0–1) + cognitive level → evidence quality
export function scoreToQuality(
  scoreRaw: number,
  cognitiveLevel: string
): "WEAK" | "PARTIAL" | "SOLID" | "STRONG" {
  // Higher cognitive levels have stricter quality thresholds
  const thresholds: Record<string, [number, number, number]> = {
    RECALL:        [0.4, 0.6, 0.85],
    UNDERSTANDING: [0.45, 0.65, 0.85],
    APPLICATION:   [0.5, 0.7, 0.88],
    REASONING:     [0.5, 0.7, 0.88],
    DEFENSIBILITY: [0.55, 0.75, 0.9],
  };

  const [weakThreshold, partialThreshold, solidThreshold] =
    thresholds[cognitiveLevel] ?? [0.4, 0.6, 0.8];

  if (scoreRaw < weakThreshold)    return "WEAK";
  if (scoreRaw < partialThreshold) return "PARTIAL";
  if (scoreRaw < solidThreshold)   return "SOLID";
  return "STRONG";
}
