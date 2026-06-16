"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { Toast } from "@/components/ui/Toast";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { fetchJsonWithRetry, fetchWithRetry } from "@/lib/http/retry";
import { ReactFlow, Background, Controls, MarkerType, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const TRIGGERS = [
  { id: "NEW_INCIDENT", label: "New Incident" },
  { id: "VENDOR_RISK_THRESHOLD", label: "Vendor Risk Score > Threshold" },
  { id: "COMPLIANCE_VIOLATION", label: "Compliance Violation" },
  { id: "NEW_DOCUMENT_UPLOAD", label: "New Document Upload" },
] as const;

const ACTIONS = [
  "CREATE_INVESTIGATION",
  "CREATE_BAND_ROOM",
  "RECRUIT_AGENTS",
  "NOTIFY_LEGAL",
  "NOTIFY_COMPLIANCE",
  "GENERATE_REPORT",
] as const;

type TriggerType = (typeof TRIGGERS)[number]["id"];
type WorkflowAction = (typeof ACTIONS)[number];

interface WorkflowRecord {
  id: string;
  name: string;
  description: string | null;
  triggerType: TriggerType;
  triggerConfigJson: Record<string, unknown>;
  actionsJson: WorkflowAction[];
  enabled: boolean;
  createdAt: string;
}

interface WorkflowExecutionRecord {
  id: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  workflow: {
    id: string;
    name: string;
    triggerType: TriggerType;
    enabled: boolean;
  };
}

function buildFlow(triggerType: TriggerType, actions: WorkflowAction[]) {
  const triggerLabel = TRIGGERS.find((trigger) => trigger.id === triggerType)?.label ?? triggerType;
  const nodes: Node[] = [
    {
      id: "trigger",
      type: "default",
      position: { x: 80, y: 80 },
      data: { label: `Trigger: ${triggerLabel}` },
      style: {
        border: "1px solid rgba(34,211,238,0.4)",
        background: "rgba(8,18,30,0.9)",
        color: "#67e8f9",
        fontSize: 12,
      },
    },
  ];

  const edges: Edge[] = [];
  actions.forEach((action, index) => {
    const nodeId = `action-${index}`;
    nodes.push({
      id: nodeId,
      type: "default",
      position: { x: 360, y: 40 + index * 90 },
      data: { label: action.replaceAll("_", " ") },
      style: {
        border: "1px solid rgba(167,139,250,0.4)",
        background: "rgba(20,12,35,0.88)",
        color: "#c4b5fd",
        fontSize: 11,
      },
    });

    edges.push({
      id: `e-trigger-${nodeId}`,
      source: "trigger",
      target: nodeId,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#22d3ee" },
    });
  });

  return { nodes, edges };
}

export function WorkflowBuilderView() {
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [history, setHistory] = useState<WorkflowExecutionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("NEW_INCIDENT");
  const [threshold, setThreshold] = useState(70);
  const [actions, setActions] = useState<WorkflowAction[]>(["CREATE_INVESTIGATION", "GENERATE_REPORT"]);
  const [submitting, setSubmitting] = useState(false);

  const selectedFlow = useMemo(() => buildFlow(triggerType, actions), [triggerType, actions]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [workflowData, historyData] = await Promise.all([
        fetchJsonWithRetry<{ workflows: WorkflowRecord[] }>("/api/workflows", { cache: "no-store" }, { retries: 2 }),
        fetchJsonWithRetry<{ executions: WorkflowExecutionRecord[] }>("/api/workflows/history", { cache: "no-store" }, { retries: 2 }),
      ]);
      setWorkflows(workflowData.workflows ?? []);
      setHistory(historyData.executions ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load workflow builder";
      setError(message);
      setToast({ kind: "error", message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const createWorkflow = async () => {
    if (!name.trim()) {
      setToast({ kind: "error", message: "Workflow name is required" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        triggerType,
        triggerConfig: triggerType === "VENDOR_RISK_THRESHOLD" ? { threshold } : {},
        actions,
        graph: {
          nodes: selectedFlow.nodes,
          edges: selectedFlow.edges,
        },
        enabled: true,
      };
      const response = await fetchWithRetry("/api/workflows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }, { retries: 1 });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to create workflow");

      setName("");
      setDescription("");
      setActions(["CREATE_INVESTIGATION", "GENERATE_REPORT"]);
      setToast({ kind: "success", message: "Workflow created" });
      await loadData();
    } catch (err) {
      setToast({ kind: "error", message: err instanceof Error ? err.message : "Failed to create workflow" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWorkflow = async (workflow: WorkflowRecord) => {
    try {
      const response = await fetchWithRetry(`/api/workflows/${workflow.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: !workflow.enabled }),
      }, { retries: 1 });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to update workflow");
      setToast({ kind: "success", message: `Workflow ${!workflow.enabled ? "enabled" : "disabled"}` });
      await loadData();
    } catch (err) {
      setToast({ kind: "error", message: err instanceof Error ? err.message : "Failed to update workflow" });
    }
  };

  const removeWorkflow = async (workflow: WorkflowRecord) => {
    try {
      const response = await fetchWithRetry(`/api/workflows/${workflow.id}`, { method: "DELETE" }, { retries: 1 });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to delete workflow");
      setToast({ kind: "success", message: "Workflow deleted" });
      await loadData();
    } catch (err) {
      setToast({ kind: "error", message: err instanceof Error ? err.message : "Failed to delete workflow" });
    }
  };

  return (
    <AppShell title="Workflow Builder" subtitle="Trigger-driven enterprise automation with execution history">
      {toast && <Toast kind={toast.kind} message={toast.message} />}
      <div className="grid h-[calc(100vh-5.5rem)] min-h-0 grid-cols-12 gap-3 overflow-hidden p-3">
        <ScrollArea className="col-span-12 min-h-0 lg:col-span-4">
          <div className="space-y-3 pr-1">
          <CyberPanel title="Create Workflow" glow="cyan" hover={false}>
            <div className="space-y-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Workflow name"
                className="w-full rounded border border-cyan-500/20 bg-black/30 px-3 py-2 font-mono text-xs text-slate-200 outline-none"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description"
                rows={3}
                className="w-full rounded border border-cyan-500/20 bg-black/30 px-3 py-2 font-mono text-xs text-slate-200 outline-none"
              />
              <select
                value={triggerType}
                onChange={(event) => setTriggerType(event.target.value as TriggerType)}
                className="w-full rounded border border-cyan-500/20 bg-black/30 px-3 py-2 font-mono text-xs text-slate-200 outline-none"
              >
                {TRIGGERS.map((trigger) => (
                  <option key={trigger.id} value={trigger.id}>{trigger.label}</option>
                ))}
              </select>

              {triggerType === "VENDOR_RISK_THRESHOLD" && (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={threshold}
                  onChange={(event) => setThreshold(Number(event.target.value) || 0)}
                  className="w-full rounded border border-amber-500/20 bg-black/30 px-3 py-2 font-mono text-xs text-slate-200 outline-none"
                  placeholder="Risk threshold"
                />
              )}

              <div className="rounded border border-violet-500/20 bg-violet-500/[0.04] p-2.5">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-violet-300">Actions</div>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIONS.map((action) => {
                    const checked = actions.includes(action);
                    return (
                      <label key={action} className="flex items-center gap-1.5 font-mono text-[10px] text-slate-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setActions((current) => {
                              if (event.target.checked) return [...current, action];
                              return current.filter((item) => item !== action);
                            });
                          }}
                        />
                        {action.replaceAll("_", " ")}
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                disabled={submitting || actions.length === 0}
                onClick={() => void createWorkflow()}
                className="w-full rounded border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 font-mono text-xs text-cyan-200 disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Save Workflow"}
              </button>
            </div>
          </CyberPanel>

          <CyberPanel title="Stored Workflows" glow="violet" hover={false}>
            <ScrollArea className="max-h-64">
            <div className="space-y-2 pr-1">
              {loading && <div className="font-mono text-xs text-slate-500">Loading workflows...</div>}
              {!loading && !workflows.length && <div className="font-mono text-xs text-slate-500">No workflows configured.</div>}
              {workflows.map((workflow) => (
                <div key={workflow.id} className="rounded border border-white/5 p-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="font-mono text-[11px] text-white">{workflow.name}</div>
                    <CyberBadge label={workflow.enabled ? "enabled" : "disabled"} variant={workflow.enabled ? "emerald" : "default"} />
                  </div>
                  <div className="font-mono text-[10px] text-slate-500">{workflow.triggerType.replaceAll("_", " ")}</div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleWorkflow(workflow)}
                      className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[10px] text-amber-200"
                    >
                      {workflow.enabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeWorkflow(workflow)}
                      className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </ScrollArea>
          </CyberPanel>
          </div>
        </ScrollArea>

        <div className="col-span-12 min-h-0 lg:col-span-5">
          <CyberPanel title="Visual Workflow Designer" glow="amber" className="h-full" noPadding hover={false}>
            <div className="h-[calc(100vh-10.5rem)] w-full">
              <ReactFlow
                nodes={selectedFlow.nodes}
                edges={selectedFlow.edges}
                fitView
                fitViewOptions={{ padding: 0.25 }}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
              >
                <Background color="rgba(51,65,85,0.35)" gap={18} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
          </CyberPanel>
        </div>

        <div className="col-span-12 min-h-0 lg:col-span-3">
          <CyberPanel title="Execution History" glow="red" className="flex h-full min-h-0 flex-col" hover={false}>
            {error && (
              <div className="mb-2">
                <div className="font-mono text-[11px] text-red-400">{error}</div>
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="mt-1 rounded border border-red-500/30 bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-300"
                >
                  Retry
                </button>
              </div>
            )}
            <ScrollArea className="flex-1">
            <div className="space-y-2 pr-1">
              {!history.length && !loading && <div className="font-mono text-xs text-slate-500">No executions yet.</div>}
              {history.map((entry) => (
                <div key={entry.id} className="rounded border border-white/5 p-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="font-mono text-[10px] text-slate-300">{entry.workflow.name}</div>
                    <CyberBadge
                      label={entry.status}
                      variant={entry.status === "completed" ? "emerald" : entry.status === "failed" ? "red" : "amber"}
                      pulse={entry.status === "running"}
                    />
                  </div>
                  <div className="font-mono text-[10px] text-slate-500">{new Date(entry.startedAt).toLocaleString()}</div>
                  {entry.errorMessage ? <div className="mt-1 font-mono text-[10px] text-red-400">{entry.errorMessage}</div> : null}
                </div>
              ))}
            </div>
            </ScrollArea>
          </CyberPanel>
        </div>
      </div>
    </AppShell>
  );
}
