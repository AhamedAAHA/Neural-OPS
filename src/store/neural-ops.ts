import { create } from "zustand";
import type { BandMessage, TimelineEvent } from "@/lib/types";
import { BAND_MESSAGES, TIMELINE, DEMO_INCIDENT } from "@/lib/mock-data";

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

export interface DemoFeature {
  id: string;
  label: string;
  done: boolean;
}

interface NeuralOpsState {
  selectedIncidentId: string | null;
  selectedNodeId: string | null;
  liveStatus: LiveStatus;
  bandConnected: boolean;
  activeAgentCount: number;
  riskScore: number;
  incidentCount: number;
  threatsBlocked: number;
  compliancePct: number;
  evidenceCount: number;
  approvalStatus: string;
  aimlLatency: number;
  featherlessLatency: number;
  tokenUsage: number;
  bandMessages: BandMessage[];
  timelineEvents: TimelineEvent[];
  auditLogs: AuditLogEntry[];
  demoFeatures: DemoFeature[];
  demoRunning: boolean;
  recruitedAgentIds: string[];
  setSelectedIncident: (id: string | null) => void;
  setSelectedNode: (id: string | null) => void;
  setLiveStatus: (status: LiveStatus) => void;
  setRiskScore: (score: number) => void;
  setActiveAgentCount: (n: number) => void;
  addBandMessage: (msg: BandMessage) => void;
  addTimelineEvent: (ev: TimelineEvent) => void;
  addAuditLog: (entry: AuditLogEntry) => void;
  markDemoFeature: (id: string) => void;
  setDemoRunning: (v: boolean) => void;
  recruitAgent: (id: string) => void;
  tickDemoValues: () => void;
  resetDemo: () => void;
}

const INITIAL_FEATURES: DemoFeature[] = [
  { id: "band_room", label: "Band room creation", done: false },
  { id: "recruitment", label: "Agent recruitment", done: false },
  { id: "context", label: "Structured context sharing", done: false },
  { id: "handoff", label: "Task handoff", done: false },
  { id: "evidence", label: "Evidence submission", done: false },
  { id: "compliance", label: "Compliance review", done: false },
  { id: "legal", label: "Legal escalation", done: false },
  { id: "risk", label: "Risk simulation", done: false },
  { id: "approval", label: "Human approval", done: false },
  { id: "executive", label: "Executive report", done: false },
  { id: "audit", label: "Audit trail", done: false },
  { id: "aiml", label: "AIML API routing", done: false },
  { id: "featherless", label: "Featherless routing", done: false },
  { id: "speechmatics", label: "Speechmatics voice", done: false },
];

const INITIAL_AUDIT: AuditLogEntry[] = [
  { id: "a1", time: "08:42", actor: "Security Monitoring", action: "Firewall alert logged", type: "detection" },
  { id: "a2", time: "08:42", actor: "Incident Commander", action: "Band room ROOM-VABC-001 created", type: "band_message" },
  { id: "a3", time: "09:35", actor: "Legal Agent", action: "Human approval requested", type: "approval" },
];

export const useNeuralOpsStore = create<NeuralOpsState>((set, get) => ({
  selectedIncidentId: DEMO_INCIDENT.id,
  selectedNodeId: null,
  liveStatus: "awaiting_approval",
  bandConnected: true,
  activeAgentCount: 7,
  riskScore: 87,
  incidentCount: 3,
  threatsBlocked: 847,
  compliancePct: 94,
  evidenceCount: 4,
  approvalStatus: "Pending",
  aimlLatency: 142,
  featherlessLatency: 198,
  tokenUsage: 12480,
  bandMessages: [...BAND_MESSAGES],
  timelineEvents: [...TIMELINE],
  auditLogs: [...INITIAL_AUDIT],
  demoFeatures: INITIAL_FEATURES.map((f) => ({ ...f })),
  demoRunning: false,
  recruitedAgentIds: ["ic", "df", "ff"],
  setSelectedIncident: (id) => set({ selectedIncidentId: id }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setLiveStatus: (status) => set({ liveStatus: status }),
  setRiskScore: (score) => set({ riskScore: score }),
  setActiveAgentCount: (n) => set({ activeAgentCount: n }),
  addBandMessage: (msg) => set((s) => ({ bandMessages: [...s.bandMessages, msg] })),
  addTimelineEvent: (ev) => set((s) => ({ timelineEvents: [...s.timelineEvents, ev] })),
  addAuditLog: (entry) => set((s) => ({ auditLogs: [entry, ...s.auditLogs] })),
  markDemoFeature: (id) =>
    set((s) => ({
      demoFeatures: s.demoFeatures.map((f) => (f.id === id ? { ...f, done: true } : f)),
    })),
  setDemoRunning: (v) => set({ demoRunning: v }),
  recruitAgent: (id) =>
    set((s) => ({
      recruitedAgentIds: s.recruitedAgentIds.includes(id) ? s.recruitedAgentIds : [...s.recruitedAgentIds, id],
      activeAgentCount: s.recruitedAgentIds.includes(id) ? s.activeAgentCount : s.activeAgentCount + 1,
    })),
  tickDemoValues: () => {
    const s = get();
    set({
      aimlLatency: Math.max(90, s.aimlLatency + Math.floor(Math.random() * 20 - 10)),
      featherlessLatency: Math.max(120, s.featherlessLatency + Math.floor(Math.random() * 24 - 12)),
      tokenUsage: s.tokenUsage + Math.floor(Math.random() * 400 + 100),
      threatsBlocked: s.threatsBlocked + (Math.random() > 0.7 ? 1 : 0),
      riskScore: Math.min(99, Math.max(75, s.riskScore + Math.floor(Math.random() * 5 - 2))),
      compliancePct: Math.min(99, Math.max(90, s.compliancePct + (Math.random() > 0.8 ? 1 : 0))),
    });
  },
  resetDemo: () =>
    set({
      bandMessages: [...BAND_MESSAGES],
      timelineEvents: [...TIMELINE],
      auditLogs: [...INITIAL_AUDIT],
      demoFeatures: INITIAL_FEATURES.map((f) => ({ ...f })),
      recruitedAgentIds: ["ic", "df", "ff"],
      activeAgentCount: 7,
      riskScore: 87,
      evidenceCount: 4,
      approvalStatus: "Pending",
      liveStatus: "awaiting_approval",
      demoRunning: false,
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
