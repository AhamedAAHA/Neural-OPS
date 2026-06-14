import { prisma } from "@/lib/db";
import { broadcastEvent } from "@/lib/realtime/broadcaster";
import { wrapAgent, createDbAgent } from "@/lib/agents/registry";
import { BandService, getBandAdapter } from "@/lib/band";

export async function saveEvidence(data: {
  incidentId: string;
  sourceAgentId: string;
  evidenceType: string;
  title: string;
  description: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  sourceReference?: string;
  bandMessageId?: string;
}) {
  const evidence = await prisma.evidence.create({ data: { ...data, metadataJson: (data.metadata ?? {}) as object } });
  await broadcastEvent({ type: "evidence_created", incidentId: data.incidentId, payload: { evidence } });
  await prisma.auditLog.create({
    data: { incidentId: data.incidentId, actorType: "agent", actorId: data.sourceAgentId, action: "evidence_created", detailsJson: { evidenceId: evidence.id } },
  });
  return evidence;
}

export async function getIncidentEvidence(incidentId: string) {
  return prisma.evidence.findMany({ where: { incidentId }, include: { sourceAgent: true }, orderBy: { createdAt: "desc" } });
}

export async function recruitAgent(roomId: string, agentRole: string, incidentId: string) {
  const bandService = new BandService();
  const room = await prisma.investigationRoom.findUnique({
    where: { id: roomId },
    include: { agents: true },
  });
  if (!room) throw new Error("Room not found");

  const agent = await createDbAgent(agentRole, roomId);
  const def = (await import("@/lib/agents/registry")).AGENT_DEFINITIONS.find((d) => d.role === agentRole)!;
  await bandService.recruitAgent(
    room.bandRoomId,
    { id: agent.id, name: def.name, role: def.role, tier: def.tier, capabilities: def.capabilities },
    { incidentId, roomId }
  );

  const commander = room.agents.find((a) => a.role === "IncidentCommanderAgent") ?? agent;
  const wrapper = await wrapAgent(commander, incidentId, roomId, room.bandRoomId);
  await wrapper.sendMessageToBand(agent.id, "AGENT_RECRUITMENT", `Recruited ${def.name}`, { agentId: agent.id });

  return agent;
}

export async function sendAgentMessage(data: {
  roomId: string;
  fromAgentId: string;
  toAgentId?: string | null;
  messageType: string;
  incidentId: string;
  summary: string;
  payload?: Record<string, unknown>;
  confidence?: number;
}) {
  const room = await prisma.investigationRoom.findUnique({ where: { id: data.roomId } });
  if (!room) throw new Error("Room not found");

  const fromAgent = await prisma.agent.findUnique({ where: { id: data.fromAgentId } });
  if (!fromAgent) throw new Error("Agent not found");

  const wrapper = await wrapAgent(fromAgent, data.incidentId, data.roomId, room.bandRoomId);
  return wrapper.sendMessageToBand(
    data.toAgentId ?? null,
    data.messageType as never,
    data.summary,
    data.payload ?? {},
    { confidence: data.confidence }
  );
}

export async function createHandoff(data: {
  roomId: string;
  fromAgentId: string;
  toAgentId: string;
  taskTitle: string;
  taskPayload?: Record<string, unknown>;
  incidentId: string;
}) {
  const room = await prisma.investigationRoom.findUnique({ where: { id: data.roomId } });
  if (!room) throw new Error("Room not found");

  const fromAgent = await prisma.agent.findUnique({ where: { id: data.fromAgentId } });
  if (!fromAgent) throw new Error("Agent not found");

  const wrapper = await wrapAgent(fromAgent, data.incidentId, data.roomId, room.bandRoomId);
  return wrapper.handoffTask(data.toAgentId, data.taskTitle, data.taskPayload ?? {});
}

export async function getRoomMessages(roomId: string) {
  const bandService = new BandService();
  const room = await prisma.investigationRoom.findUnique({ where: { id: roomId } });
  if (!room) return [];

  await bandService.syncRoomMessages(roomId);

  const dbMessages = await prisma.agentMessage.findMany({
    where: { roomId },
    include: { agent: true, recipient: true },
    orderBy: { createdAt: "asc" },
  });

  const band = getBandAdapter();
  const bandMessages = await band.getRoomMessages(room.bandRoomId);

  return { dbMessages, bandMessages };
}

export async function broadcastToRoom(roomId: string, fromAgentId: string, incidentId: string, summary: string, payload: Record<string, unknown>) {
  return sendAgentMessage({ roomId, fromAgentId, messageType: "CONTEXT_SHARE", incidentId, summary, payload, toAgentId: null });
}

export async function listAgents(roomId?: string) {
  return prisma.agent.findMany({
    where: roomId ? { roomId } : undefined,
    orderBy: { createdAt: "asc" },
  });
}

export async function getAgent(id: string) {
  return prisma.agent.findUnique({ where: { id }, include: { room: true } });
}
