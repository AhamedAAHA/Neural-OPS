import { prisma } from "@/lib/db";
import { broadcastEvent } from "@/lib/realtime/broadcaster";
import { classifyVoiceIntent, transcribeAudio } from "@/lib/speechmatics/service";
import { createIncident } from "@/lib/services/incident-service";
import { startInvestigationWorkflow } from "@/lib/services/workflow-service";
import { generateExecutiveReport } from "@/lib/services/report-service";
import { reviewCompliance } from "@/lib/services/compliance-service";
import { sendAgentMessage } from "@/lib/services/agent-service";
import type { AuthUser } from "@/lib/auth/session";
import { createDbAgent } from "@/lib/agents/registry";

export async function processVoiceTranscript(user: AuthUser, transcript: string, incidentId?: string) {
  const { intent, confidence, routedAgentRole } = await classifyVoiceIntent(transcript);

  const routedAgent = incidentId
    ? await prisma.agent.findFirst({ where: { role: routedAgentRole, room: { incidentId } } })
    : null;

  const voiceCommand = await prisma.voiceCommand.create({
    data: {
      userId: user.id,
      incidentId,
      transcript,
      intent,
      confidence,
      routedAgentId: routedAgent?.id,
    },
  });

  await broadcastEvent({
    type: "voice_transcript",
    incidentId,
    payload: { voiceCommand, intent },
  });

  const result = await routeVoiceIntent(user, intent, transcript, incidentId, routedAgent?.id);
  return { voiceCommand, intent, confidence, routedAgentRole, result };
}

async function routeVoiceIntent(
  user: AuthUser,
  intent: string,
  transcript: string,
  incidentId?: string,
  agentId?: string
) {
  switch (intent) {
    case "CREATE_INCIDENT": {
      const title = extractEntity(transcript) ?? "Voice-initiated incident";
      const { incident, room } = await createIncident(user, {
        title: `Investigation: ${title}`,
        description: transcript,
        type: "Vendor Fraud",
        severity: "high",
      });
      await startInvestigationWorkflow(incident.id);
      return { incidentId: incident.id, roomId: room.id };
    }
    case "COMPLIANCE_REVIEW": {
      if (!incidentId) throw new Error("incidentId required");
      const findings = await reviewCompliance(incidentId, ["GDPR", "SOC2", "ISO 27001"]);
      return { findings };
    }
    case "GENERATE_REPORT": {
      if (!incidentId) throw new Error("incidentId required");
      const report = await generateExecutiveReport(incidentId);
      return { reportId: report.id };
    }
    case "ESCALATE_LEGAL":
    case "REQUEST_APPROVAL": {
      if (!incidentId) throw new Error("incidentId required");
      const room = await prisma.investigationRoom.findFirst({ where: { incidentId } });
      let legalAgent = await prisma.agent.findFirst({ where: { role: "LegalAgent", room: { incidentId } } });
      if (!legalAgent && room) legalAgent = await createDbAgent("LegalAgent", room.id);
      if (legalAgent && room) {
        await sendAgentMessage({
          roomId: room.id,
          fromAgentId: legalAgent.id,
          toAgentId: null,
          messageType: "APPROVAL_REQUEST",
          incidentId,
          summary: `Voice command: ${transcript}`,
          payload: { voiceIntent: intent },
        });
      }
      return { escalated: true };
    }
    case "LIST_INCIDENTS": {
      const incidents = await prisma.incident.findMany({
        where: { severity: { in: ["critical", "high"] } },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      return { incidents };
    }
    default:
      if (incidentId && agentId) {
        const room = await prisma.investigationRoom.findFirst({ where: { incidentId } });
        if (room) {
          await sendAgentMessage({
            roomId: room.id,
            fromAgentId: agentId,
            toAgentId: null,
            messageType: "VOICE_COMMAND",
            incidentId,
            summary: transcript,
            payload: { intent },
          });
        }
      }
      return { routed: true, intent };
  }
}

function extractEntity(transcript: string): string | null {
  const match = transcript.match(/for\s+(.+?)(?:\s+fraud|\s+breach|$)/i);
  return match?.[1]?.trim() ?? null;
}

export { transcribeAudio };
