import type { ProviderName } from "./types";

export const AGENT_MODEL_ROUTING: Record<string, ProviderName> = {
  IncidentCommanderAgent: "AIML_API",
  DigitalForensicsAgent: "AIML_API",
  CommunicationAnalysisAgent: "AIML_API",
  FinancialForensicsAgent: "AIML_API",
  IdentityInvestigationAgent: "AIML_API",
  TimelineReconstructionAgent: "AIML_API",
  SecurityMonitoringAgent: "AIML_API",
  ThreatIntelligenceAgent: "AIML_API",
  SocialIntelligenceAgent: "AIML_API",
  CorrelationAgent: "AIML_API",
  RootCauseAgent: "AIML_API",
  ImpactAnalysisAgent: "AIML_API",
  FutureRiskSimulationAgent: "FEATHERLESS",
  ComplianceAgent: "FEATHERLESS",
  LegalAgent: "AIML_API",
  AuditAgent: "LOCAL",
  PRResponseAgent: "AIML_API",
  CustomerCommunicationAgent: "AIML_API",
  RemediationAgent: "AIML_API",
  ExecutiveStrategyAgent: "AIML_API",
};

export function getProviderForAgent(agentClassName: string): ProviderName {
  return AGENT_MODEL_ROUTING[agentClassName] ?? "AIML_API";
}
