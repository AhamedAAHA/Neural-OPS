"use client";

import { useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useNeuralOpsStore } from "@/store/neural-ops";

export function useRealtime(incidentId?: string) {
  const setRiskScore = useNeuralOpsStore((s) => s.setRiskScore);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    if (!supabase || !incidentId) return;

    const channel = supabase
      .channel(`incident:${incidentId}`)
      .on("broadcast", { event: "risk_update" }, (payload) => {
        const score = (payload.payload as { payload?: { assessment?: { riskScore?: number } } })?.payload?.assessment?.riskScore;
        if (score) setRiskScore(score);
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("[Realtime] Channel error, realtime updates disabled for this session.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [incidentId, setRiskScore]);
}
