export type RealtimeEventType =
  | "agent_message"
  | "evidence_created"
  | "task_handoff"
  | "approval_requested"
  | "approval_updated"
  | "voice_transcript"
  | "incident_status"
  | "risk_update"
  | "report_generated";

export interface RealtimeEvent {
  type: RealtimeEventType;
  incidentId?: string;
  roomId?: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export async function broadcastEvent(event: Omit<RealtimeEvent, "timestamp">) {
  const full: RealtimeEvent = { ...event, timestamp: new Date().toISOString() };

  const { createSupabaseAdmin } = await import("@/lib/supabase/client");
  const supabase = createSupabaseAdmin();

  if (supabase) {
    const channel = incidentIdChannel(event.incidentId);
    const ch = supabase.channel(channel);
    await ch.subscribe();
    await ch.send({
      type: "broadcast",
      event: event.type,
      payload: full,
    });
    await supabase.removeChannel(ch);
  }

  return full;
}

function incidentIdChannel(incidentId?: string) {
  return incidentId ? `incident:${incidentId}` : "neural-ops:global";
}

export { incidentIdChannel };
