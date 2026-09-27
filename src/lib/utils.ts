import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function cognitiveLabel(level: string) {
  const labels: Record<string, string> = {
    RECALL: "Recall",
    UNDERSTANDING: "Understanding",
    APPLICATION: "Application",
    REASONING: "Reasoning",
    DEFENSIBILITY: "Interview Defensibility",
  };
  return labels[level] ?? level;
}

export function qualityLabel(quality: string) {
  const labels: Record<string, string> = {
    WEAK: "Weak",
    PARTIAL: "Partial",
    SOLID: "Solid",
    STRONG: "Strong",
  };
  return labels[quality] ?? quality;
}

export function difficultyLabel(d: string) {
  const labels: Record<string, string> = {
    FOUNDATIONAL: "Foundational",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
  };
  return labels[d] ?? d;
}

export function scoreToPercent(score: number | null): string {
  if (score === null) return "—";
  return `${Math.round(score * 100)}%`;
}
