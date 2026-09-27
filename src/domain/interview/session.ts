// Derive current node from turn history (no currentNodeId stored on session)
import type { ScriptGraph, BranchCondition } from "./types";

type TurnRecord = {
  turnIndex: number;
  followUpTrigger: string | null;
};

export function deriveCurrentNodeId(
  graph: ScriptGraph,
  turns: TurnRecord[]
): string | null {
  if (turns.length === 0) return graph.startNodeId;

  // Replay the graph from start through each turn
  let nodeId: string | null = graph.startNodeId;
  const sortedTurns = [...turns].sort((a, b) => a.turnIndex - b.turnIndex);

  for (const turn of sortedTurns) {
    if (!nodeId) return null; // interview ended
    const node: ScriptGraph["nodes"][string] | undefined = graph.nodes[nodeId];
    if (!node) return null;

    const branchCondition = turn.followUpTrigger as BranchCondition | null;
    if (!branchCondition) return null; // incomplete turn, shouldn't happen

    const branch: { condition: BranchCondition; nextNodeId: string | null } | undefined =
      node.branches.find((b) => b.condition === branchCondition);
    nodeId = branch?.nextNodeId ?? null;
  }

  return nodeId;
}
