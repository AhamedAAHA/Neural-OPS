/** Agent className → preferred model provider (avoids circular imports with base-agent). */
const AGENT_PROVIDER_MAP: Record<string, string> = {
  SecurityMonitoringAgent: "AIML_API",
  ThreatIntelligenceAgent: "AIML_API",
  SocialIntelligenceAgent: "AIML_API",
  IncidentCommanderAgent: "AIML_API",
  DigitalForensicsAgent: "AIML_API",
  CommunicationAnalysisAgent: "AIML_API",
  FinancialForensicsAgent: "AIML_API",
  IdentityInvestigationAgent: "AIML_API",
  TimelineReconstructionAgent: "AIML_API",
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

export function getProviderForAgent(className: string): string {
  return AGENT_PROVIDER_MAP[className] ?? "AIML_API";
}
