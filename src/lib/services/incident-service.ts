import { prisma } from "@/lib/db";
import { BandService } from "@/lib/band";
import { broadcastEvent } from "@/lib/realtime/broadcaster";
import { AGENT_DEFINITIONS, createDbAgent, wrapAgent } from "@/lib/agents/registry";
import type { AuthUser } from "@/lib/auth/session";
import type { Severity } from "@prisma/client";

export async function createIncident(
  user: AuthUser,
  data: { title: string; description: string; type: string; severity: Severity }
) {
  const bandService = new BandService();

  const incident = await prisma.incident.create({
    data: {
      ...data,
      status: "open",
      createdBy: user.id,
      organizationId: user.organizationId,
    },
  });

  const bandRoomId = await bandService.createRoom(
    `Investigation: ${data.title}`,
    {
      incidentId: incident.id,
      type: data.type,
      severity: data.severity,
    },
    { incidentId: incident.id }
  );

  const room = await prisma.investigationRoom.create({
    data: {
      incidentId: incident.id,
      bandRoomId,
      name: `ROOM-${incident.id.slice(-6).toUpperCase()}`,
      status: "active",
    },
  });

  await prisma.bandRoom.updateMany({
    where: { roomExternalId: bandRoomId },
    data: {
      organizationId: user.organizationId,
      name: room.name,
      status: room.status,
      metadataJson: { source: "band_sdk", incidentType: data.type },
    },
  });

  const commanderDef = AGENT_DEFINITIONS.find((d) => d.className === "IncidentCommanderAgent")!;
  const commander = await createDbAgent("IncidentCommanderAgent", room.id);

  await bandService.recruitAgent(
    bandRoomId,
    {
      id: commander.id,
      name: commanderDef.name,
      role: commanderDef.role,
      tier: commanderDef.tier,
      capabilities: commanderDef.capabilities,
    },
    { incidentId: incident.id, roomId: room.id }
  );

  const agent = await wrapAgent(commander, incident.id, room.id, bandRoomId);
  await agent.sendMessageToBand(null, "AGENT_RECRUITMENT", `Investigation room created for: ${data.title}`, {
    roomId: room.id,
    bandRoomId,
    incidentId: incident.id,
  });

  await prisma.auditLog.create({
    data: {
      incidentId: incident.id,
      actorType: "user",
      actorId: user.id,
      action: "incident_created",
      detailsJson: { title: data.title, roomId: room.id, bandRoomId },
    },
  });

  await broadcastEvent({
    type: "incident_status",
    incidentId: incident.id,
    payload: { status: "open", roomId: room.id },
  });

  return { incident, room, commander };
}

export async function getIncidentDetails(id: string) {
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      rooms: { include: { agents: true, messages: { orderBy: { createdAt: "asc" }, take: 50 } } },
      evidence: { include: { sourceAgent: true }, orderBy: { createdAt: "desc" } },
      vendorIntelligence: {
        include: { vendor: { select: { id: true, name: true, country: true, industry: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      riskAssessments: { orderBy: { createdAt: "desc" }, take: 1 },
      complianceFindings: true,
      legalFindings: true,
      approvals: true,
      reports: { orderBy: { createdAt: "desc" }, take: 1 },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });
  return incident;
}

export async function listIncidents(filters?: { severity?: string; status?: string; organizationId?: string }) {
  return prisma.incident.findMany({
    where: {
      ...(filters?.organizationId ? { organizationId: filters.organizationId } : {}),
      ...(filters?.severity ? { severity: filters.severity as Severity } : {}),
      ...(filters?.status ? { status: filters.status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { rooms: { select: { id: true, bandRoomId: true, name: true } } },
  });
}
