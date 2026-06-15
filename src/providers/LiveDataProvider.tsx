"use client";

import { useCallback, useEffect, useRef } from "react";
import { fetchJsonWithRetry } from "@/lib/http/retry";
import { useNeuralOpsStore } from "@/store/neural-ops";

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const hydrateDashboard = useNeuralOpsStore((s) => s.hydrateDashboard);
  const hydrateIncidents = useNeuralOpsStore((s) => s.hydrateIncidents);
  const hydrateIntelligence = useNeuralOpsStore((s) => s.hydrateIntelligence);
  const hydrateApprovals = useNeuralOpsStore((s) => s.hydrateApprovals);
  const hydrateExecutiveRecommendation = useNeuralOpsStore((s) => s.hydrateExecutiveRecommendation);
  const selectedIncidentId = useNeuralOpsStore((s) => s.selectedIncidentId);
  const bootstrappedRef = useRef(false);

  const loadCoreData = useCallback(async () => {
    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true;
      try {
        await fetchJsonWithRetry("/api/operations/bootstrap", { method: "POST" });
      } catch {
        bootstrappedRef.current = false;
      }
    }

    const [dashboardRes, incidentsRes, intelligenceRes] = await Promise.allSettled([
      fetchJsonWithRetry<{ dashboard?: Record<string, unknown> }>("/api/operations/dashboard", { cache: "no-store" }),
      fetchJsonWithRetry<{ incidents?: Array<{ id: string; title: string; status: string; severity: string }> }>("/api/incidents", { cache: "no-store" }),
      fetchJsonWithRetry<{ signals?: Array<{ id: string; source: string; agent: string; signal: string; severity: string; timestamp: string }> }>("/api/intelligence", { cache: "no-store" }),
    ]);

    let incidents = incidentsRes.status === "fulfilled" ? incidentsRes.value.incidents ?? [] : [];

    if (dashboardRes.status === "fulfilled" && dashboardRes.value.dashboard) {
      hydrateDashboard(dashboardRes.value.dashboard);
    }
    hydrateIncidents(incidents);
    if (intelligenceRes.status === "fulfilled") {
      hydrateIntelligence(intelligenceRes.value.signals ?? []);
    }
  }, [hydrateDashboard, hydrateIncidents, hydrateIntelligence]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!active) return;
      await loadCoreData();
    };

    void load();
    const timer = setInterval(() => void load(), 15_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [loadCoreData]);

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
    const timer = setInterval(() => void loadIncidentContext(), 30_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [hydrateApprovals, hydrateExecutiveRecommendation, selectedIncidentId]);

  return children;
}
