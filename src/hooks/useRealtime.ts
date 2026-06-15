"use client";

import { useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useNeuralOpsStore } from "@/store/neural-ops";
import type { RealtimeEventType } from "@/lib/realtime/broadcaster";

const LIVE_EVENTS: RealtimeEventType[] = [
  "agent_message",
  "evidence_created",
  "task_handoff",
  "approval_requested",
  "approval_updated",
  "incident_status",
  "risk_update",
  "report_generated",
];

interface UseRealtimeOptions {
  onEvent?: () => void;
}

export function useRealtime(incidentId?: string, options?: UseRealtimeOptions) {
  const setRiskScore = useNeuralOpsStore((s) => s.setRiskScore);
  const onEvent = options?.onEvent;

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    if (!supabase || !incidentId) return;

    const channel = supabase.channel(`incident:${incidentId}`);

    for (const event of LIVE_EVENTS) {
      channel.on("broadcast", { event }, (payload) => {
        if (event === "risk_update") {
          const score = (payload.payload as { payload?: { assessment?: { riskScore?: number } } })?.payload?.assessment?.riskScore;
          if (score) setRiskScore(score);
        }
        onEvent?.();
      });
    }

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        useNeuralOpsStore.setState({ bandConnected: true });
      }
      if (status === "CHANNEL_ERROR") {
        console.warn("[Realtime] Channel error, realtime updates disabled for this session.");
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [incidentId, onEvent, setRiskScore]);
}
