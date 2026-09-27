"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ScriptGraph, ScriptNode, BranchCondition } from "@/domain/interview/types";

type CompetencyNodeOption = {
  id: string;
  title: string;
  subject: string;
  domain: string;
};

type Props = {
  competencyNodes: CompetencyNodeOption[];
  initialData?: {
    id: string;
    title: string;
    description?: string;
    competencyNodeId: string;
    isActive: boolean;
    scriptGraph: ScriptGraph;
  };
};

const BRANCH_CONDITIONS: BranchCondition[] = ["STRONG", "PARTIAL", "WEAK"];
const CONDITION_COLORS: Record<BranchCondition, string> = {
  STRONG: "text-emerald-600",
  PARTIAL: "text-amber-600",
  WEAK: "text-red-600",
};

function makeNodeId() {
  return `node_${Date.now().toString(36)}`;
}

function emptyNode(id: string): ScriptNode {
  return {
    id,
    questionText: "",
    evaluationHint: "",
    estimatedMinutes: 3,
    branches: [
      { condition: "STRONG", nextNodeId: null, label: "Strong answer" },
      { condition: "PARTIAL", nextNodeId: null, label: "Needs follow-up" },
      { condition: "WEAK", nextNodeId: null, label: "Requires remediation" },
    ],
  };
}

export function ScriptBuilder({ competencyNodes, initialData }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [competencyNodeId, setCompetencyNodeId] = useState(
    initialData?.competencyNodeId ?? ""
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? false);

  const firstId = makeNodeId();
  const [graph, setGraph] = useState<ScriptGraph>(
    initialData?.scriptGraph ?? {
      startNodeId: firstId,
      nodes: { [firstId]: emptyNode(firstId) },
    }
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    initialData?.scriptGraph.startNodeId ?? firstId
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedNode = graph.nodes[selectedNodeId];
  const nodeIds = Object.keys(graph.nodes);

  function addNode() {
    const id = makeNodeId();
    setGraph((g) => ({
      ...g,
      nodes: { ...g.nodes, [id]: emptyNode(id) },
    }));
    setSelectedNodeId(id);
  }

  function deleteNode(id: string) {
    if (id === graph.startNodeId) return; // can't delete start
    const newNodes = { ...graph.nodes };
    delete newNodes[id];
    // Clear any branches pointing to deleted node
    for (const node of Object.values(newNodes)) {
      node.branches = node.branches.map((b) =>
        b.nextNodeId === id ? { ...b, nextNodeId: null } : b
      );
    }
    setGraph((g) => ({ ...g, nodes: newNodes }));
    setSelectedNodeId(graph.startNodeId);
  }

  function updateNode(id: string, patch: Partial<ScriptNode>) {
    setGraph((g) => ({
      ...g,
      nodes: { ...g.nodes, [id]: { ...g.nodes[id], ...patch } },
    }));
  }

  function updateBranch(
    nodeId: string,
    condition: BranchCondition,
    nextNodeId: string | null
  ) {
    const node = graph.nodes[nodeId];
    const branches = node.branches.map((b) =>
      b.condition === condition ? { ...b, nextNodeId } : b
    );
    updateNode(nodeId, { branches });
  }

  async function handleSave() {
    setError("");
    if (!title.trim()) { setError("Title is required"); return; }
    if (!competencyNodeId) { setError("Competency is required"); return; }
    for (const node of Object.values(graph.nodes)) {
      if (!node.questionText.trim()) {
        setError(`Node "${node.id}" has an empty question`); return;
      }
      if (!node.evaluationHint.trim()) {
        setError(`Node "${node.id}" has an empty evaluation hint`); return;
      }
    }

    setSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/scripts/${initialData!.id}`
        : "/api/admin/scripts";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          competencyNodeId,
          scriptGraph: graph,
          ...(isEdit && { isActive }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? "Save failed");
        return;
      }

      router.push("/admin/scripts");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Title *
            </label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. OS Process & Thread Interview"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Competency Node *
            </label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={competencyNodeId}
              onChange={(e) => setCompetencyNodeId(e.target.value)}
            >
              <option value="">Select a competency…</option>
              {competencyNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.subject.replace(/_/g, " ")} — {n.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Description
          </label>
          <input
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this script tests"
          />
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            Active (visible to students)
          </label>
        )}
      </div>

      {/* Node graph editor */}
      <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
        {/* Node list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Nodes ({nodeIds.length})
            </p>
            <Button variant="outline" size="sm" onClick={addNode}>
              + Add Node
            </Button>
          </div>
          <div className="space-y-1">
            {nodeIds.map((nid) => {
              const node = graph.nodes[nid];
              const isStart = nid === graph.startNodeId;
              const isSelected = nid === selectedNodeId;
              return (
                <button
                  key={nid}
                  onClick={() => setSelectedNodeId(nid)}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors border ${
                    isSelected
                      ? "bg-secondary border-border text-foreground"
                      : "border-transparent hover:bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isStart && (
                      <Badge variant="default" className="text-xs px-1">Start</Badge>
                    )}
                    <span className="truncate">
                      {node.questionText.slice(0, 40) || "(empty)"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Node editor */}
        {selectedNode && (
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">Edit Node</p>
                {selectedNodeId === graph.startNodeId && (
                  <Badge variant="default" className="text-xs">Start</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedNodeId !== graph.startNodeId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGraph((g) => ({ ...g, startNodeId: selectedNodeId }));
                    }}
                  >
                    Set as Start
                  </Button>
                )}
                {selectedNodeId !== graph.startNodeId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteNode(selectedNodeId)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Question (shown to student) *
              </label>
              <textarea
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                rows={3}
                value={selectedNode.questionText}
                onChange={(e) =>
                  updateNode(selectedNodeId, { questionText: e.target.value })
                }
                placeholder="What is a process? How does it differ from a thread?"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Evaluation hint (AI only, not shown to student) *
              </label>
              <textarea
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                rows={3}
                value={selectedNode.evaluationHint}
                onChange={(e) =>
                  updateNode(selectedNodeId, { evaluationHint: e.target.value })
                }
                placeholder="Look for: own address space, execution state, PCB, heap/stack distinction"
              />
            </div>

            <div className="w-24">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Est. minutes
              </label>
              <input
                type="number"
                min={1}
                max={15}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                value={selectedNode.estimatedMinutes ?? 3}
                onChange={(e) =>
                  updateNode(selectedNodeId, {
                    estimatedMinutes: parseInt(e.target.value) || 3,
                  })
                }
              />
            </div>

            {/* Branch routing */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Branching (STRONG ≥ 75% · PARTIAL 40–75% · WEAK &lt; 40%)
              </p>
              <div className="space-y-2">
                {BRANCH_CONDITIONS.map((condition) => {
                  const branch = selectedNode.branches.find(
                    (b) => b.condition === condition
                  );
                  return (
                    <div key={condition} className="flex items-center gap-3">
                      <span
                        className={`text-xs font-medium w-16 shrink-0 ${CONDITION_COLORS[condition]}`}
                      >
                        {condition}
                      </span>
                      <select
                        className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        value={branch?.nextNodeId ?? ""}
                        onChange={(e) =>
                          updateBranch(
                            selectedNodeId,
                            condition,
                            e.target.value || null
                          )
                        }
                      >
                        <option value="">→ End interview</option>
                        {nodeIds
                          .filter((nid) => nid !== selectedNodeId)
                          .map((nid) => (
                            <option key={nid} value={nid}>
                              → {graph.nodes[nid].questionText.slice(0, 50) || nid}
                            </option>
                          ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Script"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/scripts")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
