"use client";

import { useEffect, useCallback } from "react";
import { useNeuralOpsStore } from "@/store/neural-ops";
import type { BandMessage, TimelineEvent } from "@/lib/types";

export function useRunLiveDemo() {
  return useCallback(() => {
    const store = useNeuralOpsStore.getState();
    if (store.demoRunning) return;

    store.resetDemo();
    store.setDemoRunning(true);

    const steps: Array<{
      delay: number;
      featureId?: string;
      recruit?: string;
      msg?: BandMessage;
      timeline?: TimelineEvent;
      audit?: { actor: string; action: string; type: string };
      patch?: Record<string, unknown>;
    }> = [
      {
        delay: 0,
        featureId: "band_room",
        patch: { liveStatus: "investigating", incidentCount: 4 },
        audit: { actor: "Incident Commander", action: "Band room ROOM-VABC-001 created for Vendor ABC fraud", type: "band_message" },
        msg: {
          id: "demo-1",
          from: "Incident Commander",
          to: "System",
          type: "AGENT_RECRUITMENT",
          content: "Investigation room ROOM-VABC-001 created for Vendor ABC suspected fraud.",
          timestamp: new Date().toISOString(),
        },
      },
      {
        delay: 2000,
        featureId: "recruitment",
        recruit: "df",
        msg: {
          id: "demo-2",
          from: "Incident Commander",
          to: "Digital Forensics",
          type: "AGENT_RECRUITMENT",
          content: "Recruiting Digital Forensics Agent for vendor payment trail analysis.",
          timestamp: new Date().toISOString(),
        },
      },
      { delay: 3500, recruit: "ff", msg: { id: "demo-3", from: "Incident Commander", to: "Financial Forensics", type: "AGENT_RECRUITMENT", content: "Recruiting Financial Forensics Agent.", timestamp: new Date().toISOString() } },
      {
        delay: 5000,
        featureId: "context",
        msg: { id: "demo-4", from: "Financial Forensics", to: "Communication Analysis", type: "CONTEXT_SHARE", content: "Suspicious vendor payment of $847,000 to Vendor ABC.", timestamp: new Date().toISOString() },
      },
      {
        delay: 6500,
        featureId: "handoff",
        msg: { id: "demo-5", from: "Digital Forensics", to: "Identity Investigation", type: "TASK_HANDOFF", content: "Unusual login from Finance Manager. Requesting identity investigation.", timestamp: new Date().toISOString() },
      },
      {
        delay: 8000,
        featureId: "evidence",
        patch: { evidenceCount: 6 },
        msg: { id: "demo-6", from: "Financial Forensics", to: "Incident Commander", type: "EVIDENCE_SUBMISSION", content: "Invoice #INV-9847 submitted — confidence 92%.", timestamp: new Date().toISOString(), metadata: { confidence: 92 } },
        timeline: { id: "td1", time: "09:08", title: "Suspicious $847K payment identified", agent: "Financial Forensics", type: "evidence" },
      },
      {
        delay: 9500,
        featureId: "compliance",
        recruit: "cp",
        msg: { id: "demo-7", from: "Compliance Agent", to: "Legal Agent", type: "REVIEW_REQUEST", content: "GDPR Art. 33 breach notification may be required.", timestamp: new Date().toISOString() },
      },
      {
        delay: 11000,
        featureId: "legal",
        recruit: "lg",
        patch: { liveStatus: "legal_review" },
        msg: { id: "demo-8", from: "Legal Agent", to: "Human Executive", type: "APPROVAL_REQUEST", content: "Freeze vendor payments and notify stakeholders.", timestamp: new Date().toISOString() },
      },
      {
        delay: 12500,
        featureId: "risk",
        recruit: "rs",
        patch: { liveStatus: "risk_simulation", riskScore: 91 },
        msg: { id: "demo-9", from: "Future Risk Simulation", to: "Executive Strategy", type: "RISK_UPDATE", content: "Fraud probability: 91%. Exposure: $2.4M.", timestamp: new Date().toISOString(), metadata: { confidence: 91 } },
      },
      { delay: 14000, featureId: "approval", patch: { liveStatus: "awaiting_approval", approvalStatus: "Awaiting Human Approval" }, audit: { actor: "Legal Agent", action: "Human approval gate opened", type: "approval" } },
      {
        delay: 15500,
        featureId: "executive",
        recruit: "es",
        patch: { liveStatus: "executive_waiting" },
        msg: { id: "demo-10", from: "Executive Strategy", to: "Human Executive", type: "DECISION", content: "Executive report generated. Awaiting final decision.", timestamp: new Date().toISOString() },
        timeline: { id: "td2", time: "09:40", title: "Executive report generated", agent: "Executive Strategy", type: "decision" },
      },
      { delay: 17000, featureId: "audit", patch: { evidenceCount: 47 }, audit: { actor: "Audit Agent", action: "47 evidence items catalogued", type: "audit" } },
      { delay: 18500, featureId: "aiml", audit: { actor: "AIML API", action: "Routed: Incident Commander → gpt-4o-mini (142ms)", type: "model" } },
      { delay: 20000, featureId: "featherless", audit: { actor: "Featherless", action: "Routed: Legal Agent → Llama-3.3-70B (198ms)", type: "model" } },
      { delay: 21500, featureId: "speechmatics", audit: { actor: "Speechmatics", action: "Voice: Start investigation for Vendor ABC fraud", type: "voice" } },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        const s = useNeuralOpsStore.getState();
        if (step.featureId) s.markDemoFeature(step.featureId);
        if (step.recruit) s.recruitAgent(step.recruit);
        if (step.msg) s.addBandMessage(step.msg);
        if (step.timeline) s.addTimelineEvent(step.timeline);
        if (step.audit) {
          s.addAuditLog({
            id: `audit-${Date.now()}-${Math.random()}`,
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
            ...step.audit,
          });
        }
        if (step.patch) useNeuralOpsStore.setState(step.patch);
      }, step.delay);
    });

    setTimeout(() => useNeuralOpsStore.getState().setDemoRunning(false), 23000);
  }, []);
}

export function DemoRealtimeProvider({ children }: { children: React.ReactNode }) {
  const tickDemoValues = useNeuralOpsStore((s) => s.tickDemoValues);

  useEffect(() => {
    const id = setInterval(tickDemoValues, 3500);
    return () => clearInterval(id);
  }, [tickDemoValues]);

  return <>{children}</>;
}
