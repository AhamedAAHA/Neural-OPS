"use client";

import { useEffect } from "react";
import { fetchJsonWithRetry } from "@/lib/http/retry";
import { useNeuralOpsStore } from "@/store/neural-ops";

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const hydrateDashboard = useNeuralOpsStore((s) => s.hydrateDashboard);
  const hydrateIncidents = useNeuralOpsStore((s) => s.hydrateIncidents);
  const hydrateIntelligence = useNeuralOpsStore((s) => s.hydrateIntelligence);
  const hydrateApprovals = useNeuralOpsStore((s) => s.hydrateApprovals);
  const hydrateExecutiveRecommendation = useNeuralOpsStore((s) => s.hydrateExecutiveRecommendation);
  const selectedIncidentId = useNeuralOpsStore((s) => s.selectedIncidentId);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [dashboardRes, incidentsRes, intelligenceRes] = await Promise.allSettled([
        fetchJsonWithRetry<{ dashboard?: Record<string, unknown> }>("/api/operations/dashboard", { cache: "no-store" }),
        fetchJsonWithRetry<{ incidents?: Array<{ id: string; title: string; status: string; severity: string }> }>("/api/incidents", { cache: "no-store" }),
        fetchJsonWithRetry<{ signals?: Array<{ id: string; source: string; agent: string; signal: string; severity: string; timestamp: string }> }>("/api/intelligence", { cache: "no-store" }),
      ]);

      if (!active) return;

      if (dashboardRes.status === "fulfilled" && dashboardRes.value.dashboard) {
        hydrateDashboard(dashboardRes.value.dashboard);
      }
      if (incidentsRes.status === "fulfilled") {
        hydrateIncidents(incidentsRes.value.incidents ?? []);
      }
      if (intelligenceRes.status === "fulfilled") {
        hydrateIntelligence(intelligenceRes.value.signals ?? []);
      }
    };

    void load();
    const timer = setInterval(() => void load(), 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [hydrateDashboard, hydrateIncidents, hydrateIntelligence]);

  useEffect(() => {
    if (!selectedIncidentId) return;
    let active = true;

    const loadIncidentContext = async () => {
      const [approvalsRes, decisionRes] = await Promise.allSettled([
        fetchJsonWithRetry<{
          approvals?: Array<{
            id: string;
            status: string;
            title?: string;
            approverRole?: string | null;
            approverName?: string | null;
            decisionNote?: string | null;
            updatedAt?: string;
            requestedBy?: { name: string; role: string } | null;
            decidedBy?: { name: string; role: string } | null;
          }>;
        }>(`/api/approvals?incidentId=${encodeURIComponent(selectedIncidentId)}`, { cache: "no-store" }),
        fetchJsonWithRetry<{
          decision?: { recommendedAction?: string; reasoningChain?: string[]; confidenceScore?: number };
        }>(`/api/decisions?incidentId=${encodeURIComponent(selectedIncidentId)}`, { cache: "no-store" }),
      ]);

      if (!active) return;
      if (approvalsRes.status === "fulfilled") {
        hydrateApprovals(approvalsRes.value.approvals ?? []);
      }
      if (decisionRes.status === "fulfilled" && decisionRes.value.decision) {
        hydrateExecutiveRecommendation(decisionRes.value.decision);
      }
    };

    void loadIncidentContext();
    const timer = setInterval(() => void loadIncidentContext(), 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [hydrateApprovals, hydrateExecutiveRecommendation, selectedIncidentId]);

  return children;
}
