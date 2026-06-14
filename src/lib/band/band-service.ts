import type { AgentProfile, BandAdapter, BandMessagePayload } from "./types";
import { getBandAdapter } from "./index";
import { prisma } from "@/lib/db";
import { broadcastEvent } from "@/lib/realtime/broadcaster";
import type { MessageType, ModelProvider, Prisma } from "@prisma/client";
import { recordMonitoringEvent } from "@/lib/observability/store";

export interface SendBandMessageInput {
  roomId: string;
  bandRoomId: string;
  incidentId: string;
  fromAgentId: string;
  toAgentId: string | null;
  messageType: MessageType;
  summary: string;
  payload?: Record<string, unknown>;
  requiredAction?: string;
  confidence?: number;
  modelProvider?: ModelProvider;
}

export class BandService {
  constructor(private readonly adapter: BandAdapter = getBandAdapter()) {}

  private async touchRoom(bandRoomId: string, data: Prisma.BandRoomUpdateInput) {
    await prisma.bandRoom.updateMany({
      where: { roomExternalId: bandRoomId },
      data: {
        ...data,
        status: "active",
      },
    });
  }

  async createRoom(
    name: string,
    metadata: Record<string, unknown>,
    options?: { incidentId?: string; organizationId?: string }
  ): Promise<string> {
    const started = Date.now();
    const bandRoomId = await this.adapter.createRoom(name, metadata);

    if (options?.incidentId) {
      await prisma.bandRoom.upsert({
        where: { roomExternalId: bandRoomId },
        update: {
          name,
          status: "active",
          organizationId: options.organizationId,
          metadataJson: metadata as Prisma.InputJsonValue,
          lastActivityAt: new Date(),
        },
        create: {
          incidentId: options.incidentId,
          organizationId: options.organizationId,
          roomExternalId: bandRoomId,
          name,
          status: "active",
          metadataJson: metadata as Prisma.InputJsonValue,
          connectedAgents: 0,
          messageCount: 0,
          lastActivityAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          incidentId: options.incidentId,
          organizationId: options.organizationId,
          actorType: "system",
          actorId: "band-service",
          action: "band_room_created",
          detailsJson: { bandRoomId, name },
        },
      });
    }

    void recordMonitoringEvent({
      organizationId: options?.organizationId,
      incidentId: options?.incidentId,
      source: "BAND",
      operation: "band.createRoom",
      durationMs: Date.now() - started,
      details: { bandRoomId, name },
    }).catch(() => {});

    return bandRoomId;
  }

  async recruitAgent(
    bandRoomId: string,
    agent: AgentProfile,
    options?: { incidentId?: string; roomId?: string; organizationId?: string }
  ) {
    const started = Date.now();
    await this.adapter.recruitAgent(bandRoomId, agent);

    const connectedAgents = options?.roomId
      ? await prisma.agent.count({ where: { roomId: options.roomId, status: { not: "offline" } } })
      : undefined;

    await this.touchRoom(bandRoomId, {
      connectedAgents,
      lastActivityAt: new Date(),
      metadataJson: {
        lastJoinedAgent: { id: agent.id, name: agent.name, role: agent.role },
      } as Prisma.InputJsonValue,
    });

    if (options?.incidentId) {
      await prisma.auditLog.create({
        data: {
          incidentId: options.incidentId,
          organizationId: options.organizationId,
          actorType: "system",
          actorId: "band-service",
          action: "band_agent_recruited",
          detailsJson: { bandRoomId, agentId: agent.id, role: agent.role },
        },
      });
    }
    void recordMonitoringEvent({
      organizationId: options?.organizationId,
      incidentId: options?.incidentId,
      source: "BAND",
      operation: "band.recruitAgent",
      durationMs: Date.now() - started,
      details: { bandRoomId, agentId: agent.id, role: agent.role },
    }).catch(() => {});
  }

  async sendMessage(input: SendBandMessageInput): Promise<{ bandMessageId: string; content: BandMessagePayload }> {
    const started = Date.now();
    const content: BandMessagePayload = {
      roomId: input.bandRoomId,
      fromAgent: input.fromAgentId,
      toAgent: input.toAgentId,
      messageType: input.messageType,
      incidentId: input.incidentId,
      summary: input.summary,
      payload: input.payload ?? {},
      requiredAction: input.requiredAction,
      confidence: input.confidence,
      modelProvider: input.modelProvider,
      createdAt: new Date().toISOString(),
    };

    const bandMessageId = await this.adapter.sendMessage(
      input.bandRoomId,
      input.fromAgentId,
      input.toAgentId,
      content
    );

    await this.touchRoom(input.bandRoomId, { lastActivityAt: new Date() });
    void recordMonitoringEvent({
      incidentId: input.incidentId,
      source: "BAND",
      operation: "band.sendMessage",
      durationMs: Date.now() - started,
      details: {
        bandRoomId: input.bandRoomId,
        fromAgentId: input.fromAgentId,
        toAgentId: input.toAgentId,
        messageType: input.messageType,
      },
    }).catch(() => {});

    return { bandMessageId, content };
  }

  async updateRoomMetrics(roomId: string, bandRoomId: string) {
    const [dbMessageCount, connectedAgents] = await Promise.all([
      prisma.agentMessage.count({ where: { roomId } }),
      prisma.agent.count({ where: { roomId, status: { not: "offline" } } }),
    ]);

    await this.touchRoom(bandRoomId, {
      messageCount: dbMessageCount,
      connectedAgents,
      lastActivityAt: new Date(),
    });
  }

  async syncRoomMessages(roomId: string): Promise<{ synced: number }> {
    const started = Date.now();
    const room = await prisma.investigationRoom.findUnique({
      where: { id: roomId },
      include: { incident: true },
    });
    if (!room) return { synced: 0 };

    const bandMessages = await this.adapter.getRoomMessages(room.bandRoomId);
    let synced = 0;

    for (const message of bandMessages) {
      const exists = await prisma.agentMessage.findUnique({ where: { bandMessageId: message.id } });
      if (exists) continue;

      const sender = await prisma.agent.upsert({
        where: { id: message.fromAgent },
        create: {
          id: message.fromAgent,
          name: `Band Agent ${message.fromAgent.slice(0, 6)}`,
          role: "ExternalBandAgent",
          tier: "Investigation",
          framework: "band",
          provider: message.modelProvider ?? "LOCAL",
          status: "active",
          capabilities: [],
          roomId: room.id,
        },
        update: { status: "active" },
      });

      let recipientId: string | null = null;
      if (message.toAgent) {
        const recipient = await prisma.agent.findUnique({ where: { id: message.toAgent } });
        recipientId = recipient?.id ?? null;
      }

      const created = await prisma.agentMessage.create({
        data: {
          roomId: room.id,
          agentId: sender.id,
          recipientAgentId: recipientId,
          messageType: message.messageType,
          contentJson: message as unknown as Prisma.InputJsonValue,
          bandMessageId: message.id,
          modelProvider: message.modelProvider,
          confidence: message.confidence,
          createdAt: new Date(message.createdAt),
        },
      });

      synced += 1;
      await broadcastEvent({
        type: "agent_message",
        incidentId: room.incidentId,
        roomId: room.id,
        payload: { message: created, bandMessageId: message.id, synced: true },
      });
    }

    await this.updateRoomMetrics(room.id, room.bandRoomId);

    if (synced > 0) {
      await prisma.auditLog.create({
        data: {
          incidentId: room.incidentId,
          actorType: "system",
          actorId: "band-service",
          action: "band_messages_synced",
          detailsJson: { roomId: room.id, bandRoomId: room.bandRoomId, synced },
        },
      });
    }

    void recordMonitoringEvent({
      incidentId: room.incidentId,
      source: "BAND",
      operation: "band.syncRoomMessages",
      durationMs: Date.now() - started,
      details: { roomId, synced, bandRoomId: room.bandRoomId },
    }).catch(() => {});

    return { synced };
  }

  async getRoomStatus(incidentId?: string) {
    return prisma.bandRoom.findFirst({
      where: incidentId ? { incidentId } : undefined,
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        incidentId: true,
        roomExternalId: true,
        name: true,
        status: true,
        connectedAgents: true,
        messageCount: true,
        lastActivityAt: true,
        updatedAt: true,
      },
    });
  }
}
