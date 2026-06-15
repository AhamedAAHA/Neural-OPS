import { create } from "zustand";
import type { ApprovalChainStep, BandMessage, RiskBreakdown, TimelineEvent } from "@/lib/types";
import { calculateEnterpriseRiskScore } from "@/lib/risk-scoring";

export type LiveStatus =
  | "idle"
  | "investigating"
  | "awaiting_approval"
  | "legal_review"
  | "executive_waiting"
  | "risk_simulation";

export interface AuditLogEntry {
  id: string;
  time: string;
  actor: string;
  action: string;
  type: string;
}

export interface IntelligenceSignal {
  id: string;
  source: string;
  agent: string;
  signal: string;
  severity: string;
  timestamp: string;
}

const EMPTY_RISK_BREAKDOWN: RiskBreakdown = {
  threatSeverity: 0,
  financialExposure: 0,
  complianceExposure: 0,
  vendorRisk: 0,
  operationalImpact: 0,
  reputationImpact: 0,
};

interface NeuralOpsState {
  selectedIncidentId: string | null;
  selectedNodeId: string | null;
  activeTenantId: string;
  activeTenantName: string;
  liveStatus: LiveStatus;
  bandConnected: boolean;
  activeAgentCount: number;
  riskScore: number;
  riskBreakdown: RiskBreakdown;
  incidentCount: number;
  openApprovals: number;
  threatsBlocked: number;
  compliancePct: number;
  complianceExposure: number;
  financialExposure: number;
  vendorRiskExposure: number;
  evidenceCount: number;
  approvalStatus: string;
  approvalChain: ApprovalChainStep[];
  aimlLatency: number;
  featherlessLatency: number;
  brightDataLatency: number;
  tokenUsage: number;
  bandMessages: BandMessage[];
  timelineEvents: TimelineEvent[];
  auditLogs: AuditLogEntry[];
  intelligenceSignals: IntelligenceSignal[];
  executiveRecommendation: { action: string; rationale: string; confidence: number };
  recruitedAgentIds: string[];
  setSelectedIncident: (id: string | null) => void;
  setSelectedNode: (id: string | null) => void;
  setActiveTenant: (id: string, name?: string) => void;
  setLiveStatus: (status: LiveStatus) => void;
  setRiskScore: (score: number) => void;
  setRiskBreakdown: (b: RiskBreakdown) => void;
  setActiveAgentCount: (n: number) => void;
  addBandMessage: (msg: BandMessage) => void;
  addTimelineEvent: (ev: TimelineEvent) => void;
  addAuditLog: (entry: AuditLogEntry) => void;
  addIntelligenceSignal: (signal: IntelligenceSignal) => void;
  advanceApprovalStep: (stepId: string, status: ApprovalChainStep["status"], note?: string) => void;
  recruitAgent: (id: string) => void;
  hydrateDashboard: (dashboard: Record<string, unknown>) => void;
  hydrateIncidents: (incidents: Array<{ id: string; title: string; status: string; severity: string }>) => void;
  hydrateIntelligence: (signals: IntelligenceSignal[]) => void;
  hydrateApprovals: (approvals: Array<{ id: string; status: string; title?: string; approverRole?: string | null; approverName?: string | null; decidedBy?: { name: string; role: string } | null; requestedBy?: { name: string; role: string } | null; updatedAt?: string | null; decisionNote?: string | null }>) => void;
  hydrateExecutiveRecommendation: (decision: { recommendedAction?: string; reasoningChain?: string[]; confidenceScore?: number }) => void;
}

function formatEventTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export const useNeuralOpsStore = create<NeuralOpsState>((set) => ({
  selectedIncidentId: null,
  selectedNodeId: null,
  activeTenantId: "",
  activeTenantName: "",
  liveStatus: "idle",
  bandConnected: false,
  activeAgentCount: 0,
  riskScore: 0,
  riskBreakdown: { ...EMPTY_RISK_BREAKDOWN },
  incidentCount: 0,
  openApprovals: 0,
  threatsBlocked: 0,
  compliancePct: 0,
  complianceExposure: 0,
  financialExposure: 0,
  vendorRiskExposure: 0,
  evidenceCount: 0,
  approvalStatus: "No pending approvals",
  approvalChain: [],
  aimlLatency: 0,
  featherlessLatency: 0,
  brightDataLatency: 0,
  tokenUsage: 0,
  bandMessages: [],
  timelineEvents: [],
  auditLogs: [],
  intelligenceSignals: [],
  executiveRecommendation: { action: "Awaiting incident analysis", rationale: "No executive recommendation generated yet.", confidence: 0 },
  recruitedAgentIds: [],
  setSelectedIncident: (id) => set({ selectedIncidentId: id }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setActiveTenant: (id, name) => set({ activeTenantId: id, ...(name ? { activeTenantName: name } : {}) }),
  setLiveStatus: (status) => set({ liveStatus: status }),
  setRiskScore: (score) => set({ riskScore: score }),
  setRiskBreakdown: (b) => set({ riskBreakdown: b, riskScore: calculateEnterpriseRiskScore(b) }),
  setActiveAgentCount: (n) => set({ activeAgentCount: n }),
  addBandMessage: (msg) => set((s) => ({ bandMessages: [...s.bandMessages, msg] })),
  addTimelineEvent: (ev) => set((s) => ({ timelineEvents: [...s.timelineEvents, ev] })),
  addAuditLog: (entry) => set((s) => ({ auditLogs: [entry, ...s.auditLogs] })),
  addIntelligenceSignal: (signal) => set((s) => ({ intelligenceSignals: [signal, ...s.intelligenceSignals] })),
  advanceApprovalStep: (stepId, status, note) =>
    set((s) => ({
      approvalChain: s.approvalChain.map((step) =>
        step.id === stepId
          ? {
              ...step,
              status,
              timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
              note: note ?? `${status} by ${step.role}`,
            }
          : step
      ),
      openApprovals: Math.max(0, s.openApprovals - (status === "approved" ? 1 : 0)),
    })),
  recruitAgent: (id) =>
    set((s) => ({
      recruitedAgentIds: s.recruitedAgentIds.includes(id) ? s.recruitedAgentIds : [...s.recruitedAgentIds, id],
      activeAgentCount: s.recruitedAgentIds.includes(id) ? s.activeAgentCount : s.activeAgentCount + 1,
    })),
  hydrateDashboard: (dashboard) =>
    set((state) => {
      const metrics = (dashboard.metrics as Record<string, number> | undefined) ?? {};
      const services = (dashboard.services as Record<string, { latency?: number; status?: string; activeConnections?: number }> | undefined) ?? {};
      const api = (dashboard.api as { responseTimeMs?: number } | undefined) ?? {};
      const latestEvents = (dashboard.latestEvents as Array<{ id: string; source: string; operation: string; message?: string | null; createdAt: string; level?: string; status?: string }> | undefined) ?? [];

      const bandStatus = services.band?.status ?? "down";
      const realtimeConnections = (services.realtime as { activeConnections?: number } | undefined)?.activeConnections ?? 0;

      return {
        incidentCount: metrics.activeInvestigations ?? state.incidentCount,
        activeAgentCount: Math.max(state.activeAgentCount, realtimeConnections),
        bandConnected: bandStatus === "healthy" || realtimeConnections > 0 || state.bandConnected,
        aimlLatency: Math.round(services.agent?.latency ?? api.responseTimeMs ?? 0),
        featherlessLatency: Math.round(services.database?.latency ?? 0),
        brightDataLatency: Math.round(services.brightData?.latency ?? 0),
        threatsBlocked: latestEvents.filter((event) => event.level === "error" || event.status === "error").length,
        compliancePct: services.database?.status === "healthy" ? 100 : services.database?.status === "degraded" ? 75 : 0,
        auditLogs: latestEvents.slice(0, 8).map((event) => ({
          id: event.id,
          time: formatEventTime(event.createdAt),
          actor: event.source,
          action: event.message ?? event.operation,
          type: event.source.toLowerCase(),
        })),
      };
    }),
  hydrateIncidents: (incidents) =>
    set((state) => ({
      incidentCount: incidents.length,
      selectedIncidentId: state.selectedIncidentId ?? incidents[0]?.id ?? null,
      liveStatus: incidents.some((i) => i.status === "pending_approval")
        ? "awaiting_approval"
        : incidents.some((i) => i.status === "investigating")
          ? "investigating"
          : incidents.length
            ? "idle"
            : "idle",
    })),
  hydrateIntelligence: (signals) => set({ intelligenceSignals: signals }),
  hydrateApprovals: (approvals) =>
    set({
      approvalChain: approvals.map((approval) => ({
        id: approval.id,
        role: approval.approverRole ?? approval.requestedBy?.role ?? "Approver",
        name: approval.approverName ?? approval.decidedBy?.name ?? approval.requestedBy?.name ?? "Pending assignee",
        status: approval.status as ApprovalChainStep["status"],
        timestamp: approval.updatedAt ? formatEventTime(approval.updatedAt) : null,
        note: approval.decisionNote ?? approval.title ?? null,
      })),
      openApprovals: approvals.filter((approval) => approval.status === "pending").length,
      approvalStatus: approvals.some((approval) => approval.status === "pending") ? "Pending Approval" : "No pending approvals",
    }),
  hydrateExecutiveRecommendation: (decision) =>
    set({
      executiveRecommendation: {
        action: decision.recommendedAction ?? "Awaiting incident analysis",
        rationale: decision.reasoningChain?.[0] ?? "No executive recommendation generated yet.",
        confidence: decision.confidenceScore ?? 0,
      },
    }),
}));

interface VoiceState {
  isListening: boolean;
  transcript: string;
  waveform: number[];
  setListening: (v: boolean) => void;
  setTranscript: (t: string) => void;
  setWaveform: (w: number[]) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isListening: false,
  transcript: "",
  waveform: Array(32).fill(0.1),
  setListening: (v) => set({ isListening: v }),
  setTranscript: (t) => set({ transcript: t }),
  setWaveform: (w) => set({ waveform: w }),
}));
