import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/session";
import { createIncident } from "./incident-service";
import { startInvestigationWorkflow } from "./workflow-service";

const DEFAULT_LIVE_INCIDENT = {
  title: "Vendor ABC suspected of fraud",
  description:
    "Suspicious vendor payments totaling $847K detected. Finance Manager credentials used for unauthorized approval.",
  type: "Vendor Fraud",
  severity: "critical" as const,
};

async function autoResolvePendingApprovals(organizationId: string) {
  const pendingApprovals = await prisma.humanApproval.findMany({
    where: {
      status: "pending",
      incident: { organizationId },
    },
    select: { id: true, incidentId: true },
  });

  if (!pendingApprovals.length) return;

  await prisma.humanApproval.updateMany({
    where: { id: { in: pendingApprovals.map((approval) => approval.id) } },
    data: {
      status: "approved",
      decisionNote: "Auto-approved by Neural OPS policy (admin-operated deployment)",
    },
  });

  const incidentIds = [...new Set(pendingApprovals.map((approval) => approval.incidentId))];
  await prisma.incident.updateMany({
    where: {
      id: { in: incidentIds },
      status: "pending_approval",
    },
    data: { status: "contained" },
  });
}

async function syncBandRoomsForOrganization(organizationId: string) {
  const rooms = await prisma.investigationRoom.findMany({
    where: { incident: { organizationId } },
    include: {
      incident: { select: { id: true, organizationId: true } },
      agents: { select: { id: true, status: true } },
      messages: { select: { id: true } },
    },
  });

  await Promise.all(
    rooms.map((room) =>
      prisma.bandRoom.upsert({
        where: { roomExternalId: room.bandRoomId },
        update: {
          organizationId,
          incidentId: room.incidentId,
          name: room.name,
          status: room.status,
          connectedAgents: room.agents.filter((agent) => agent.status !== "offline").length,
          messageCount: room.messages.length,
          lastActivityAt: new Date(),
        },
        create: {
          organizationId,
          incidentId: room.incidentId,
          roomExternalId: room.bandRoomId,
          name: room.name,
          status: room.status,
          connectedAgents: room.agents.filter((agent) => agent.status !== "offline").length,
          messageCount: room.messages.length,
          lastActivityAt: new Date(),
          metadataJson: { source: "live_sync" },
        },
      })
    )
  );
}

export async function ensureLiveOperations(user: AuthUser) {
  await syncBandRoomsForOrganization(user.organizationId);
  await autoResolvePendingApprovals(user.organizationId);

  const existingCount = await prisma.incident.count({
    where: { organizationId: user.organizationId },
  });

  if (existingCount > 0) {
    const activeAgents = await prisma.agent.count({
      where: {
        status: { not: "offline" },
        room: { incident: { organizationId: user.organizationId } },
      },
    });

    return {
      bootstrapped: false,
      incidentCount: existingCount,
      activeAgents,
    };
  }

  const result = await createIncident(user, DEFAULT_LIVE_INCIDENT);
  await startInvestigationWorkflow(result.incident.id);
  await syncBandRoomsForOrganization(user.organizationId);

  const activeAgents = await prisma.agent.count({
    where: {
      status: { not: "offline" },
      room: { incidentId: result.incident.id },
    },
  });

  return {
    bootstrapped: true,
    incident: result.incident,
    room: result.room,
    activeAgents,
  };
}
