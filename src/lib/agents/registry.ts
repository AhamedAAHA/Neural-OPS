import type { Agent } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BaseAgent, type AgentContext } from "./base-agent";
import { recordMonitoringEvent } from "@/lib/observability/store";
import {
  AGENT_DEFINITIONS,
  SecurityMonitoringAgent,
  ThreatIntelligenceAgent,
  SocialIntelligenceAgent,
  IncidentCommanderAgent,
  DigitalForensicsAgent,
  CommunicationAnalysisAgent,
  FinancialForensicsAgent,
  IdentityInvestigationAgent,
  TimelineReconstructionAgent,
  CorrelationAgent,
  RootCauseAgent,
  ImpactAnalysisAgent,
  FutureRiskSimulationAgent,
  ComplianceAgent,
  LegalAgent,
  AuditAgent,
  PRResponseAgent,
  CustomerCommunicationAgent,
  RemediationAgent,
  ExecutiveStrategyAgent,
} from "./all-agents";

export { AGENT_DEFINITIONS };

const AGENT_CLASSES: Record<string, new () => BaseAgent> = {
  SecurityMonitoringAgent,
  ThreatIntelligenceAgent,
  SocialIntelligenceAgent,
  IncidentCommanderAgent,
  DigitalForensicsAgent,
  CommunicationAnalysisAgent,
  FinancialForensicsAgent,
  IdentityInvestigationAgent,
  TimelineReconstructionAgent,
  CorrelationAgent,
  RootCauseAgent,
  ImpactAnalysisAgent,
  FutureRiskSimulationAgent,
  ComplianceAgent,
  LegalAgent,
  AuditAgent,
  PRResponseAgent,
  CustomerCommunicationAgent,
  RemediationAgent,
  ExecutiveStrategyAgent,
};

export function instantiateAgent(
  className: string,
  partial: Omit<AgentContext, "dbAgent"> & { dbAgent: Agent }
): BaseAgent {
  const Cls = AGENT_CLASSES[className];
  if (!Cls) throw new Error(`Unknown agent class: ${className}`);
  const agent = new Cls();
  agent.setContext(partial as AgentContext);
  return agent;
}

export function getAgentByRole(role: string): new () => BaseAgent {
  const def = AGENT_DEFINITIONS.find((d) => d.role === role || d.className === role);
  if (!def) throw new Error(`Unknown agent role: ${role}`);
  return AGENT_CLASSES[def.className];
}

export async function createDbAgent(role: string, roomId: string): Promise<Agent> {
  const def = AGENT_DEFINITIONS.find((d) => d.role === role || d.className === role)!;
  return prisma.agent.create({
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
}

export async function wrapAgent(dbAgent: Agent, incidentId: string, roomId: string, bandRoomId: string): Promise<BaseAgent> {
  const def = AGENT_DEFINITIONS.find((d) => d.role === dbAgent.role || d.name === dbAgent.name);
  const className = def?.className ?? "IncidentCommanderAgent";
  const instance = instantiateAgent(className, { incidentId, roomId, bandRoomId, dbAgent });
  const originalAnalyze = instance.analyze.bind(instance);
  instance.analyze = async (input: Record<string, unknown>) => {
    const started = Date.now();
    try {
      const result = await originalAnalyze(input);
      void recordMonitoringEvent({
        incidentId,
        source: "AGENT",
        operation: `${className}.analyze`,
        durationMs: Date.now() - started,
        details: {
          roomId,
          agentId: dbAgent.id,
        },
      }).catch(() => {});
      return result;
    } catch (error) {
      void recordMonitoringEvent({
        incidentId,
        source: "AGENT",
        level: "error",
        operation: `${className}.analyze`,
        status: "error",
        durationMs: Date.now() - started,
        message: error instanceof Error ? error.message : "Agent analyze failed",
        details: {
          roomId,
          agentId: dbAgent.id,
        },
      }).catch(() => {});
      throw error;
    }
  };
  return instance;
}
