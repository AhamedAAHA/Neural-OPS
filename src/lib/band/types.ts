import type { MessageType, ModelProvider } from "@prisma/client";

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  tier: string;
  capabilities: string[];
}

export interface BandMessagePayload {
  roomId: string;
  fromAgent: string;
  toAgent: string | null;
  messageType: MessageType;
  incidentId: string;
  summary: string;
  payload: Record<string, unknown>;
  requiredAction?: string;
  confidence?: number;
  modelProvider?: ModelProvider;
  createdAt: string;
}

export interface BandMessage extends BandMessagePayload {
  id: string;
}

export interface BandAdapter {
  createRoom(name: string, metadata: object): Promise<string>;
  recruitAgent(roomId: string, agent: AgentProfile): Promise<void>;
  sendMessage(
    roomId: string,
    fromAgentId: string,
    toAgentId: string | null,
    content: BandMessagePayload
  ): Promise<string>;
  getRoomMessages(roomId: string): Promise<BandMessage[]>;
}
