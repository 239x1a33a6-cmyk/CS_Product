// Interview script graph types — scriptGraph is stored as Json in the DB

export type BranchCondition = "STRONG" | "PARTIAL" | "WEAK";

export type ScriptBranch = {
  condition: BranchCondition;
  nextNodeId: string | null; // null = end of interview
  label: string;
};

export type ScriptNode = {
  id: string;
  questionText: string;
  evaluationHint: string; // Shown to AI evaluator, not to student
  competencyNodeId?: string | null;
  estimatedMinutes?: number;
  branches: ScriptBranch[];
};

export type ScriptGraph = {
  startNodeId: string;
  nodes: Record<string, ScriptNode>;
};

// Thresholds for branch routing
export const BRANCH_THRESHOLDS = {
  STRONG: 0.75,  // >= 0.75 → STRONG
  PARTIAL: 0.4,  // >= 0.4 and < 0.75 → PARTIAL
  // < 0.4 → WEAK
} as const;

export function scoreToBranchCondition(scoreRaw: number): BranchCondition {
  if (scoreRaw >= BRANCH_THRESHOLDS.STRONG) return "STRONG";
  if (scoreRaw >= BRANCH_THRESHOLDS.PARTIAL) return "PARTIAL";
  return "WEAK";
}

// AI evaluation request for a single interview turn
export type InterviewEvalRequest = {
  questionText: string;
  evaluationHint: string;
  studentResponse: string;
  competencyTitle: string;
};

export type InterviewEvalResult = {
  scoreRaw: number;
  feedback: string; // brief, conversational — shown during interview
  branchCondition: BranchCondition;
};
