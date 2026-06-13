import type { BandAdapter, BandMessage, BandMessagePayload, AgentProfile } from "./types";

export class RealBandAdapter implements BandAdapter {
  private baseUrl: string;
  private apiKey: string;
  private workspaceId: string;

  constructor() {
    this.baseUrl = process.env.BAND_API_BASE_URL ?? "https://api.band.ai/v1";
    this.apiKey = process.env.BAND_API_KEY ?? "";
    this.workspaceId = process.env.BAND_WORKSPACE_ID ?? "";
  }

  private async request<T>(path: string, method: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "X-Workspace-Id": this.workspaceId,
        "X-Agent-Secret": process.env.BAND_AGENT_SECRET ?? "",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Band API error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  async createRoom(name: string, metadata: object): Promise<string> {
    const data = await this.request<{ id: string }>("/rooms", "POST", {
      name,
      metadata,
      workspace_id: this.workspaceId,
    });
    return data.id;
  }

  async recruitAgent(roomId: string, agent: AgentProfile): Promise<void> {
    await this.request(`/rooms/${roomId}/agents`, "POST", {
      agent_id: agent.id,
      name: agent.name,
      role: agent.role,
      tier: agent.tier,
      capabilities: agent.capabilities,
    });
  }

  async sendMessage(
    roomId: string,
    fromAgentId: string,
    toAgentId: string | null,
    content: BandMessagePayload
  ): Promise<string> {
    const data = await this.request<{ id: string }>(`/rooms/${roomId}/messages`, "POST", {
      from_agent_id: fromAgentId,
      to_agent_id: toAgentId,
      content,
    });
    return data.id;
  }

  async getRoomMessages(roomId: string): Promise<BandMessage[]> {
    const data = await this.request<{ messages: BandMessage[] }>(`/rooms/${roomId}/messages`, "GET");
    return data.messages ?? [];
  }
}
