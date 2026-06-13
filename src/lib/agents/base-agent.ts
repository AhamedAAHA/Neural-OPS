import type { Agent, ModelProvider, MessageType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getBandAdapter, type BandMessagePayload } from "@/lib/band";
import { completeWithFallback } from "@/lib/ai/providers";
import { getProviderForAgent } from "@/lib/ai/router";
import { broadcastEvent } from "@/lib/realtime/broadcaster";

export interface AgentContext {
  incidentId: string;
  roomId: string;
  bandRoomId: string;
  dbAgent: Agent;
}

export interface AgentDefinition {
  className: string;
  name: string;
  role: string;
  tier: "Detection" | "Investigation" | "Intelligence" | "Governance" | "Response";
  capabilities: string[];
  preferredModelProvider?: ModelProvider;
}

export abstract class BaseAgent {
  abstract definition: AgentDefinition;

  protected context!: AgentContext;

  setContext(context: AgentContext) {
    this.context = context;
  }

  async receiveContext(payload: Record<string, unknown>): Promise<void> {
    await this.logAudit("receive_context", { payload });
  }

  abstract analyze(input: Record<string, unknown>): Promise<Record<string, unknown>>;

  protected getProviderName(): string {
    return getProviderForAgent(this.definition.className);
  }

  protected async invokeAI(system: string, prompt: string, json = false) {
    const provider = this.getProviderName();
    const result = await completeWithFallback(provider, {
      system,
      prompt,
      responseFormat: json ? "json" : "text",
      temperature: 0.3,
    });

    await prisma.modelInvocation.create({
      data: {
        provider: (provider as ModelProvider) ?? "LOCAL",
        model: result.model,
        agentId: this.context.dbAgent.id,
        incidentId: this.context.incidentId,
        promptTokens: result.promptTokens ?? 0,
        completionTokens: result.completionTokens ?? 0,
        latencyMs: result.latencyMs ?? 0,
        status: "success",
      },
    });

    return result;
  }

  async sendMessageToBand(
    toAgentId: string | null,
    messageType: MessageType,
    summary: string,
    payload: Record<string, unknown> = {},
    options?: { confidence?: number; requiredAction?: string }
  ): Promise<string> {
    const band = getBandAdapter();
    const content: BandMessagePayload = {
      roomId: this.context.bandRoomId,
      fromAgent: this.context.dbAgent.id,
      toAgent: toAgentId,
      messageType,
      incidentId: this.context.incidentId,
      summary,
      payload,
      requiredAction: options?.requiredAction,
      confidence: options?.confidence,
      modelProvider: (this.getProviderName() as ModelProvider) ?? "LOCAL",
      createdAt: new Date().toISOString(),
    };

    const bandMessageId = await band.sendMessage(
      this.context.bandRoomId,
      this.context.dbAgent.id,
      toAgentId,
      content
    );

    const msg = await prisma.agentMessage.create({
      data: {
        roomId: this.context.roomId,
        agentId: this.context.dbAgent.id,
        recipientAgentId: toAgentId,
        messageType,
        contentJson: content as object,
        bandMessageId,
        modelProvider: content.modelProvider,
        confidence: options?.confidence,
      },
    });

    await broadcastEvent({
      type: "agent_message",
      incidentId: this.context.incidentId,
      roomId: this.context.roomId,
      payload: { message: msg, bandMessageId },
    });

    await this.logAudit("band_message_sent", { messageType, summary, bandMessageId });
    return bandMessageId;
  }

  async handoffTask(toAgentId: string, taskTitle: string, taskPayload: Record<string, unknown>) {
    const bandMessageId = await this.sendMessageToBand(toAgentId, "TASK_HANDOFF", taskTitle, taskPayload);

    const handoff = await prisma.taskHandoff.create({
      data: {
        roomId: this.context.roomId,
        fromAgentId: this.context.dbAgent.id,
        toAgentId,
        taskTitle,
        taskPayloadJson: taskPayload as object,
        bandMessageId,
      },
    });

    await broadcastEvent({
      type: "task_handoff",
      incidentId: this.context.incidentId,
      roomId: this.context.roomId,
      payload: { handoff },
    });

    return handoff;
  }

  async recruitAgent(agentRole: string, incidentId: string, roomId: string) {
    const { AGENT_DEFINITIONS, instantiateAgent } = await import("@/lib/agents/registry");
    const def = AGENT_DEFINITIONS.find((d) => d.role === agentRole || d.className === agentRole);
    if (!def) throw new Error(`Unknown agent role: ${agentRole}`);

    const dbAgent = await prisma.agent.create({
      data: {
        name: def.name,
        role: def.role,
        tier: def.tier,
        capabilities: def.capabilities,
        provider: def.preferredModelProvider ?? "AIML_API",
        status: "active",
        roomId,
      },
    });

    const band = getBandAdapter();
    await band.recruitAgent(
      (await prisma.investigationRoom.findUnique({ where: { id: roomId } }))!.bandRoomId,
      { id: dbAgent.id, name: def.name, role: def.role, tier: def.tier, capabilities: def.capabilities }
    );

    await this.sendMessageToBand(dbAgent.id, "AGENT_RECRUITMENT", `Recruited ${def.name}`, {
      agentId: dbAgent.id,
      role: def.role,
    });

    await this.logAudit("agent_recruited", { agentId: dbAgent.id, role: def.role });
    return instantiateAgent(def.className, { incidentId, roomId, bandRoomId: "", dbAgent });
  }

  async requestHumanApproval(actionTitle: string, actionDescription: string, riskLevel: "critical" | "high" | "medium" | "low") {
    const approval = await prisma.humanApproval.create({
      data: {
        incidentId: this.context.incidentId,
        requestedByAgentId: this.context.dbAgent.id,
        actionTitle,
        actionDescription,
        riskLevel,
      },
    });

    await this.sendMessageToBand(null, "APPROVAL_REQUEST", actionTitle, {
      approvalId: approval.id,
      actionDescription,
      riskLevel,
    }, { requiredAction: "Human executive decision required" });

    await broadcastEvent({
      type: "approval_requested",
      incidentId: this.context.incidentId,
      payload: { approval },
    });

    return approval;
  }

  protected async logAudit(action: string, details: Record<string, unknown>) {
    await prisma.auditLog.create({
      data: {
        incidentId: this.context.incidentId,
        actorType: "agent",
        actorId: this.context.dbAgent.id,
        action,
        detailsJson: details as object,
      },
    });
  }
}
