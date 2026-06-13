import { randomUUID } from "crypto";
import type { BandAdapter, BandMessage, BandMessagePayload, AgentProfile } from "./types";

export class MockBandAdapter implements BandAdapter {
  private rooms = new Map<string, { name: string; metadata: object; agents: AgentProfile[]; messages: BandMessage[] }>();

  async createRoom(name: string, metadata: object): Promise<string> {
    const roomId = `band_room_${randomUUID()}`;
    this.rooms.set(roomId, { name, metadata, agents: [], messages: [] });
    return roomId;
  }

  async recruitAgent(roomId: string, agent: AgentProfile): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Band room not found: ${roomId}`);
    if (!room.agents.find((a) => a.id === agent.id)) {
      room.agents.push(agent);
    }
  }

  async sendMessage(
    roomId: string,
    fromAgentId: string,
    toAgentId: string | null,
    content: BandMessagePayload
  ): Promise<string> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Band room not found: ${roomId}`);

    const id = `band_msg_${randomUUID()}`;
    const message: BandMessage = { ...content, id, fromAgent: fromAgentId, toAgent: toAgentId };
    room.messages.push(message);
    return id;
  }

  async getRoomMessages(roomId: string): Promise<BandMessage[]> {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return room.messages;
  }
}

let mockInstance: MockBandAdapter | null = null;

export function getMockBandAdapter(): MockBandAdapter {
  if (!mockInstance) mockInstance = new MockBandAdapter();
  return mockInstance;
}
