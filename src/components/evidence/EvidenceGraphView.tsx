"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Background, Controls, MarkerType, MiniMap, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AppShell } from "@/components/layout/AppShell";
import { CyberBadge, CyberPanel } from "@/components/cyber/CyberPanel";
import { JsonViewer } from "@/components/cyber/JsonViewer";
import { EVIDENCE_FILTERS } from "@/lib/constants";
import { fetchJsonWithRetry } from "@/lib/http/retry";
import { formatTimestamp } from "@/lib/utils";
import type { EvidenceNode } from "@/lib/types";

interface IncidentSummary {
  id: string;
  title: string;
}

interface IncidentEvidence {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  confidence: number;
  createdAt: string;
  evidenceType: string;
  sourceAgent?: { name: string | null } | null;
  incident?: { id: string; title: string } | null;
}

const ALL_INCIDENTS_VALUE = "__all__";

const EDGE_COLORS: Record<string, string> = {
  flow: "#22d3ee",
};

function riskFromConfidence(confidence: number): EvidenceNode["riskLevel"] {
  if (confidence >= 0.9) return "critical";
  if (confidence >= 0.75) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

function buildNodes(evidence: IncidentEvidence[]): Node[] {
  const columns = 4;
  const xGap = 220;
  const yGap = 120;
  return evidence.map((item, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const mapped: EvidenceNode = {
      id: item.id,
      label: item.title,
      type: item.evidenceType,
      confidence: Math.round(item.confidence * 100),
      sourceAgent: item.sourceAgent?.name ?? "Unknown Agent",
      timestamp: item.createdAt,
      riskLevel: riskFromConfidence(item.confidence),
      description: item.description,
    };
    return {
      id: item.id,
      position: { x: 80 + col * xGap, y: 60 + row * yGap },
      data: { label: item.title, node: mapped },
      style: {
        background: "rgba(5, 12, 28, 0.72)",
        border: `1px solid ${mapped.riskLevel === "critical" ? "rgba(239,68,68,0.45)" : mapped.riskLevel === "high" ? "rgba(245,158,11,0.4)" : "rgba(34,211,238,0.28)"}`,
        borderRadius: "8px",
        padding: "8px 12px",
        color: "#e2e8f0",
        fontSize: "10px",
        fontFamily: "JetBrains Mono, monospace",
        minWidth: "140px",
      },
    };
  });
}

function buildEdges(evidence: IncidentEvidence[]): Edge[] {
  const sorted = [...evidence].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const edges: Edge[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    edges.push({
      id: `edge-${sorted[i - 1].id}-${sorted[i].id}`,
      source: sorted[i - 1].id,
      target: sorted[i].id,
      label: "flow",
      animated: i === sorted.length - 1,
      style: { stroke: EDGE_COLORS.flow, strokeWidth: 2 },
      labelStyle: { fill: "#94a3b8", fontSize: 9, fontFamily: "JetBrains Mono" },
      markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLORS.flow },
    });
  }
  return edges;
}

export function EvidenceGraphView() {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [incidentId, setIncidentId] = useState<string>(ALL_INCIDENTS_VALUE);
  const [rawEvidence, setRawEvidence] = useState<IncidentEvidence[]>([]);
  const [selected, setSelected] = useState<EvidenceNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [timeline, setTimeline] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadIncidents = async () => {
      setLoading(true);
      try {
        setError(null);
        const data = await fetchJsonWithRetry<{ incidents: IncidentSummary[] }>("/api/incidents", { cache: "no-store" }, { retries: 2 });
        if (!active) return;
        const nextIncidents = data.incidents ?? [];
        setIncidents(nextIncidents);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load incidents");
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadIncidents();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!incidentId) {
      setRawEvidence([]);
      setLoading(false);
      return;
    }
    let active = true;
    const loadIncidentEvidence = async () => {
      setLoading(true);
      try {
        setError(null);
        const query = incidentId === ALL_INCIDENTS_VALUE ? "" : `?incidentId=${encodeURIComponent(incidentId)}`;
        const data = await fetchJsonWithRetry<{ evidence: IncidentEvidence[] }>(`/api/evidence${query}`, { cache: "no-store" }, { retries: 2 });
        if (!active) return;
        setRawEvidence(data.evidence ?? []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load evidence");
        setRawEvidence([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadIncidentEvidence();
    return () => {
      active = false;
    };
  }, [incidentId]);

  const filteredEvidence = useMemo(() => {
    if (!activeFilter) return rawEvidence;
    const f = activeFilter.toLowerCase();
    return rawEvidence.filter((item) =>
      item.evidenceType.toLowerCase().includes(f) ||
      item.title.toLowerCase().includes(f) ||
      (item.sourceAgent?.name ?? "").toLowerCase().includes(f)
    );
  }, [activeFilter, rawEvidence]);

  const timelineEvidence = useMemo(() => {
    const sorted = [...filteredEvidence].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    if (timeline <= 0) return [] as IncidentEvidence[];
    if (timeline >= 100) return sorted;
    const visibleCount = Math.ceil((timeline / 100) * sorted.length);
    return sorted.slice(0, Math.max(0, visibleCount));
  }, [filteredEvidence, timeline]);

  const [stateNodes, setStateNodes] = useState<Node[]>(buildNodes(timelineEvidence));
  const [stateEdges, setStateEdges] = useState<Edge[]>(buildEdges(timelineEvidence));

  useEffect(() => {
    setStateNodes(buildNodes(timelineEvidence));
    setStateEdges(buildEdges(timelineEvidence));
  }, [timelineEvidence]);

  useEffect(() => {
    if (!selected) return;
    if (!timelineEvidence.some((item) => item.id === selected.id)) {
      setSelected(null);
    }
  }, [selected, timelineEvidence]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelected((node.data as { node: EvidenceNode }).node);
  }, []);

  const showEmptyState = !loading && !error && (incidents.length === 0 || timelineEvidence.length === 0);

  return (
    <AppShell title="Evidence Graph" subtitle="Database-backed evidence relationships" fullWidth>
      <div className="flex h-[calc(100vh-5.5rem)] gap-2 p-2">
        <div className="flex w-56 shrink-0 flex-col gap-2">
          <CyberPanel title="Incident" compact glow="cyan">
            <select
              value={incidentId}
              onChange={(event) => setIncidentId(event.target.value)}
              disabled={incidents.length === 0}
              className="w-full rounded border border-white/10 bg-slate-950 px-2 py-2 font-mono text-xs text-slate-200 disabled:opacity-50"
            >
              {incidents.length === 0 ? (
                <option value="">No incidents</option>
              ) : (
                <>
                  <option value={ALL_INCIDENTS_VALUE}>All incidents</option>
                  {incidents.map((incident) => (
                    <option key={incident.id} value={incident.id}>{incident.title}</option>
                  ))}
                </>
              )}
            </select>
          </CyberPanel>
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
            <input type="range" min={0} max={100} value={timeline} onChange={(event) => setTimeline(Number(event.target.value))} className="w-full accent-cyan-500" />
            <div className="mt-1 font-mono text-[9px] text-slate-600">Evidence at T+{timeline}% ({timelineEvidence.length}/{filteredEvidence.length})</div>
          </CyberPanel>
        </div>

        <div className="relative min-w-0 flex-1 rounded-lg border border-cyan-500/10">
          {showEmptyState && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-neural-bg/80">
              <div className="text-center">
                <p className="font-mono text-sm text-slate-400">
                  {incidents.length === 0 ? "No incidents yet" : "No evidence for this incident"}
                </p>
                <p className="mt-1 font-mono text-[10px] text-slate-600">
                  {incidents.length === 0
                    ? "Create an incident to start collecting evidence."
                    : "Evidence will appear here as agents submit findings."}
                </p>
              </div>
            </div>
          )}
          <ReactFlow
            nodes={stateNodes}
            edges={stateEdges}
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
              <p className="font-mono text-[10px] text-slate-600">Select a node to view evidence details.</p>
            </CyberPanel>
          )}
          {loading && <p className="mt-2 font-mono text-[10px] text-slate-500">Loading evidence...</p>}
          {error && <p className="mt-2 font-mono text-[10px] text-red-400">{error}</p>}
        </div>
      </div>
    </AppShell>
  );
}
