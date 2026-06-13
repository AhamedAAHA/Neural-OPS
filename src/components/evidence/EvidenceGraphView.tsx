"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { EVIDENCE_NODES, EVIDENCE_EDGES } from "@/lib/mock-data";
import { formatTimestamp, severityBg } from "@/lib/utils";
import type { EvidenceNode } from "@/lib/types";

const EDGE_COLORS: Record<string, string> = {
  approved: "#34d399",
  paid: "#f87171",
  accessed: "#a78bfa",
  contacted: "#22d3ee",
  compromised: "#ef4444",
  escalated: "#fb923c",
  reviewed: "#94a3b8",
  violated: "#f97316",
  "linked-to": "#818cf8",
};

function layoutNodes(): Node[] {
  const positions: Record<string, { x: number; y: number }> = {
    "vendor-abc": { x: 400, y: 50 },
    invoice: { x: 200, y: 150 },
    "finance-mgr": { x: 50, y: 250 },
    "payment-gw": { x: 350, y: 200 },
    email: { x: 150, y: 350 },
    "cloud-db": { x: 550, y: 200 },
    login: { x: 50, y: 450 },
    device: { x: 200, y: 500 },
    admin: { x: 350, y: 400 },
    records: { x: 550, y: 350 },
    firewall: { x: 700, y: 100 },
    policy: { x: 650, y: 450 },
    legal: { x: 500, y: 550 },
  };

  return EVIDENCE_NODES.map((node) => ({
    id: node.id,
    position: positions[node.id] ?? { x: 0, y: 0 },
    data: { label: node.label, node },
    style: {
      background: "rgba(10, 15, 30, 0.9)",
      border: `1px solid ${node.riskLevel === "critical" ? "#f87171" : node.riskLevel === "high" ? "#fb923c" : "#22d3ee40"}`,
      borderRadius: "8px",
      padding: "8px 12px",
      color: "#e2e8f0",
      fontSize: "11px",
      minWidth: "100px",
      textAlign: "center" as const,
    },
  }));
}

function layoutEdges(): Edge[] {
  return EVIDENCE_EDGES.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: edge.label === "compromised" || edge.label === "paid",
    style: { stroke: EDGE_COLORS[edge.label] ?? "#64748b", strokeWidth: 2 },
    labelStyle: { fill: "#94a3b8", fontSize: 10 },
    markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLORS[edge.label] ?? "#64748b" },
  }));
}

export function EvidenceGraphView() {
  const [nodes, , onNodesChange] = useNodesState(layoutNodes());
  const [edges, , onEdgesChange] = useEdgesState(layoutEdges());
  const [selected, setSelected] = useState<EvidenceNode | null>(null);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const evidenceNode = (node.data as { node: EvidenceNode }).node;
    setSelected(evidenceNode);
  }, []);

  const connectedAgents = useMemo(() => {
    if (!selected) return [];
    return EVIDENCE_EDGES.filter((e) => e.source === selected.id || e.target === selected.id).map((e) => e.label);
  }, [selected]);

  return (
    <AppShell title="Evidence Graph" subtitle="Interactive agent-connected evidence map · Vendor ABC Fraud" fullWidth>
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            className="bg-neural-bg"
          >
            <Background color="#1e293b" gap={20} />
            <Controls className="!bg-neural-panel !border-white/10 !fill-slate-400" />
            <MiniMap
              nodeColor={(n) => {
                const risk = (n.data as { node: EvidenceNode }).node.riskLevel;
                return risk === "critical" ? "#f87171" : risk === "high" ? "#fb923c" : "#22d3ee";
              }}
              className="!bg-neural-panel !border-white/10"
            />
          </ReactFlow>
        </div>

        <div className="w-80 shrink-0 overflow-y-auto border-l border-white/10 bg-neural-panel/50 p-4">
          {selected ? (
            <GlassCard glow="cyan" className="p-4">
              <h3 className="mb-3 text-lg font-semibold text-white">{selected.label}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-500">Type: </span>
                  <span className="text-slate-300 capitalize">{selected.type}</span>
                </div>
                <div>
                  <span className="text-slate-500">Confidence: </span>
                  <span className="font-bold text-emerald-400">{selected.confidence}%</span>
                </div>
                <div>
                  <span className="text-slate-500">Source Agent: </span>
                  <span className="text-cyan-400">{selected.sourceAgent}</span>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp: </span>
                  <span className="text-slate-400">{formatTimestamp(selected.timestamp)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Risk: </span>
                  <Badge label={selected.riskLevel} severity={selected.riskLevel} />
                </div>
                <div className="rounded-lg border border-white/5 bg-black/20 p-3 text-xs text-slate-400">
                  {selected.description}
                </div>
                {connectedAgents.length > 0 && (
                  <div>
                    <span className="text-slate-500">Connections: </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {connectedAgents.map((c) => (
                        <span key={c} className={`rounded px-2 py-0.5 text-[10px] ${severityBg("low")}`}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-4 text-center">
              <div className="text-sm text-slate-500">Click a node to view evidence details</div>
              <div className="mt-4 space-y-2 text-left text-xs text-slate-600">
                <div>13 evidence nodes connected by agents</div>
                <div>9 relationship types mapped</div>
                <div>Vendor ABC fraud investigation</div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
