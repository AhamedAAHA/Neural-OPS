"use client";

import { useCallback, useState } from "react";
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
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { JsonViewer } from "@/components/cyber/JsonViewer";
import { EVIDENCE_NODES, EVIDENCE_EDGES } from "@/lib/mock-data";
import { EVIDENCE_FILTERS } from "@/lib/constants";
import { formatTimestamp } from "@/lib/utils";
import type { EvidenceNode } from "@/lib/types";

const EDGE_COLORS: Record<string, string> = {
  approved: "#10b981", paid: "#ef4444", accessed: "#8b5cf6", contacted: "#22d3ee",
  compromised: "#ef4444", escalated: "#f59e0b", reviewed: "#64748b", violated: "#f97316", "linked-to": "#6366f1",
};

const FILTER_MAP: Record<string, string[]> = {
  Financial: ["invoice", "payment-gw", "vendor-abc", "finance-mgr"],
  Identity: ["login", "admin", "device", "finance-mgr"],
  Compliance: ["policy", "records", "legal"],
  Communication: ["email"],
  Network: ["firewall", "cloud-db", "device"],
  Legal: ["legal", "policy"],
};

function layoutNodes(): Node[] {
  const positions: Record<string, { x: number; y: number }> = {
    "vendor-abc": { x: 400, y: 50 }, invoice: { x: 200, y: 150 }, "finance-mgr": { x: 50, y: 250 },
    "payment-gw": { x: 350, y: 200 }, email: { x: 150, y: 350 }, "cloud-db": { x: 550, y: 200 },
    login: { x: 50, y: 450 }, device: { x: 200, y: 500 }, admin: { x: 350, y: 400 },
    records: { x: 550, y: 350 }, firewall: { x: 700, y: 100 }, policy: { x: 650, y: 450 }, legal: { x: 500, y: 550 },
  };

  return EVIDENCE_NODES.map((node) => ({
    id: node.id,
    position: positions[node.id] ?? { x: 0, y: 0 },
    data: { label: node.label, node },
    style: {
      background: "rgba(5, 12, 28, 0.72)",
      backdropFilter: "blur(12px)",
      border: `1px solid ${node.riskLevel === "critical" ? "rgba(239,68,68,0.45)" : node.riskLevel === "high" ? "rgba(245,158,11,0.4)" : "rgba(34,211,238,0.28)"}`,
      borderRadius: "8px",
      padding: "8px 12px",
      color: "#e2e8f0",
      fontSize: "10px",
      fontFamily: "JetBrains Mono, monospace",
      minWidth: "90px",
      textAlign: "center" as const,
      boxShadow: node.riskLevel === "critical"
        ? "0 0 16px rgba(239,68,68,0.25), inset 0 0 12px rgba(239,68,68,0.05)"
        : "0 0 20px rgba(34,211,238,0.08), inset 0 0 12px rgba(34,211,238,0.04)",
    },
  }));
}

function layoutEdges(): Edge[] {
  return EVIDENCE_EDGES.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: ["compromised", "paid", "violated"].includes(edge.label),
    style: { stroke: EDGE_COLORS[edge.label] ?? "#64748b", strokeWidth: 2 },
    labelStyle: { fill: "#94a3b8", fontSize: 9, fontFamily: "JetBrains Mono" },
    markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLORS[edge.label] ?? "#64748b" },
  }));
}

export function EvidenceGraphView() {
  const [nodes, , onNodesChange] = useNodesState(layoutNodes());
  const [edges, , onEdgesChange] = useEdgesState(layoutEdges());
  const [selected, setSelected] = useState<EvidenceNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [timeline, setTimeline] = useState(100);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelected((node.data as { node: EvidenceNode }).node);
  }, []);

  const filteredNodeIds = activeFilter ? FILTER_MAP[activeFilter] ?? [] : null;

  return (
    <AppShell title="Evidence Graph" subtitle="Interactive agent-connected evidence · Vendor ABC Fraud" fullWidth>
      <div className="flex h-[calc(100vh-5.5rem)] gap-2 p-2">
        <div className="flex w-48 shrink-0 flex-col gap-2">
          <CyberPanel title="Filters" compact glow="cyan">
            <button
              type="button"
              onClick={() => setActiveFilter(null)}
              className={`mb-1 w-full rounded border p-1.5 font-mono text-[9px] ${!activeFilter ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400" : "border-white/5 text-slate-600"}`}
            >
              ALL
            </button>
            {EVIDENCE_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`mb-1 w-full rounded border p-1.5 font-mono text-[9px] last:mb-0 ${
                  activeFilter === f ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400" : "border-white/5 text-slate-600 hover:border-cyan-500/20"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </CyberPanel>
          <CyberPanel title="Timeline" compact glow="violet">
            <input
              type="range"
              min={0}
              max={100}
              value={timeline}
              onChange={(e) => setTimeline(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="mt-1 font-mono text-[9px] text-slate-600">Evidence at T+{timeline}%</div>
          </CyberPanel>
        </div>

        <div className="min-w-0 flex-1 rounded-lg border border-cyan-500/10">
          <ReactFlow
            nodes={nodes.map((n) => ({
              ...n,
              style: {
                ...n.style,
                opacity: filteredNodeIds && !filteredNodeIds.includes(n.id) ? 0.25 : 1,
              },
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            className="bg-neural-bg"
          >
            <Background color="#1e293b" gap={24} size={1} />
            <Controls className="!bg-neural-surface !border-cyan-500/20" />
            <MiniMap
              nodeColor={(n) => {
                const risk = (n.data as { node: EvidenceNode }).node.riskLevel;
                return risk === "critical" ? "#ef4444" : risk === "high" ? "#f59e0b" : "#22d3ee";
              }}
              className="!bg-neural-surface !border-cyan-500/20"
            />
          </ReactFlow>
        </div>

        <div className="w-72 shrink-0 overflow-y-auto">
          {selected ? (
            <CyberPanel glow="cyan" title="Evidence Detail">
              <h3 className="font-mono text-sm font-bold text-white">{selected.label}</h3>
              <div className="mt-3 space-y-2 font-mono text-[10px]">
                <div><span className="text-slate-600">Confidence </span><span className="text-emerald-400">{selected.confidence}%</span></div>
                <div><span className="text-slate-600">Agent </span><span className="text-cyan-400">{selected.sourceAgent}</span></div>
                <div><span className="text-slate-600">Time </span><span className="text-slate-400">{formatTimestamp(selected.timestamp)}</span></div>
                <CyberBadge label={selected.riskLevel} variant={selected.riskLevel === "critical" ? "red" : "amber"} />
                <p className="text-slate-500">{selected.description}</p>
              </div>
              <div className="mt-3">
                <JsonViewer data={selected} height="140px" />
              </div>
            </CyberPanel>
          ) : (
            <CyberPanel>
              <p className="font-mono text-[10px] text-slate-600">Select a node to view evidence details, confidence score, and source agent.</p>
            </CyberPanel>
          )}
        </div>
      </div>
    </AppShell>
  );
}
