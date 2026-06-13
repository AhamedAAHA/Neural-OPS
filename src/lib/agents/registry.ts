import type { Agent } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BaseAgent, type AgentContext } from "./base-agent";
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
  return instantiateAgent(className, { incidentId, roomId, bandRoomId, dbAgent });
}
