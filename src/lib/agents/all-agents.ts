import { BaseAgent, type AgentDefinition } from "./base-agent";

function def(
  className: string,
  name: string,
  role: string,
  tier: AgentDefinition["tier"],
  capabilities: string[],
  provider?: AgentDefinition["preferredModelProvider"]
): AgentDefinition {
  return { className, name, role, tier, capabilities, preferredModelProvider: provider };
}

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  // Tier 1
  def("SecurityMonitoringAgent", "Security Monitoring Agent", "SecurityMonitoringAgent", "Detection", ["threat_detection", "alert_correlation"], "AIML_API"),
  def("ThreatIntelligenceAgent", "Threat Intelligence Agent", "ThreatIntelligenceAgent", "Detection", ["intel_feeds", "ioc_matching"], "AIML_API"),
  def("SocialIntelligenceAgent", "Social Intelligence Agent", "SocialIntelligenceAgent", "Detection", ["social_monitoring", "reputation_signals"], "AIML_API"),
  // Tier 2
  def("IncidentCommanderAgent", "Incident Commander Agent", "IncidentCommanderAgent", "Investigation", ["orchestration", "recruitment", "room_management"], "AIML_API"),
  def("DigitalForensicsAgent", "Digital Forensics Agent", "DigitalForensicsAgent", "Investigation", ["log_analysis", "device_forensics"], "AIML_API"),
  def("CommunicationAnalysisAgent", "Communication Analysis Agent", "CommunicationAnalysisAgent", "Investigation", ["email_analysis", "timeline_building"], "AIML_API"),
  def("FinancialForensicsAgent", "Financial Forensics Agent", "FinancialForensicsAgent", "Investigation", ["payment_tracing", "invoice_analysis"], "AIML_API"),
  def("IdentityInvestigationAgent", "Identity Investigation Agent", "IdentityInvestigationAgent", "Investigation", ["privilege_abuse", "account_anomalies"], "AIML_API"),
  def("TimelineReconstructionAgent", "Timeline Reconstruction Agent", "TimelineReconstructionAgent", "Investigation", ["event_sequencing", "causal_analysis"], "AIML_API"),
  // Tier 3
  def("CorrelationAgent", "Correlation Agent", "CorrelationAgent", "Intelligence", ["cross_source_correlation"], "AIML_API"),
  def("RootCauseAgent", "Root Cause Agent", "RootCauseAgent", "Intelligence", ["root_cause_analysis"], "AIML_API"),
  def("ImpactAnalysisAgent", "Impact Analysis Agent", "ImpactAnalysisAgent", "Intelligence", ["impact_modeling"], "AIML_API"),
  def("FutureRiskSimulationAgent", "Future Risk Simulation Agent", "FutureRiskSimulationAgent", "Intelligence", ["scenario_simulation", "risk_forecasting"], "FEATHERLESS"),
  // Tier 4
  def("ComplianceAgent", "Compliance Agent", "ComplianceAgent", "Governance", ["gdpr", "soc2", "iso27001", "policy_review"], "FEATHERLESS"),
  def("LegalAgent", "Legal Agent", "LegalAgent", "Governance", ["legal_review", "disclosure", "approval_requests"], "AIML_API"),
  def("AuditAgent", "Audit Agent", "AuditAgent", "Governance", ["audit_trail", "action_logging"], "LOCAL"),
  // Tier 5
  def("PRResponseAgent", "PR Response Agent", "PRResponseAgent", "Response", ["media_strategy", "public_statements"], "AIML_API"),
  def("CustomerCommunicationAgent", "Customer Communication Agent", "CustomerCommunicationAgent", "Response", ["customer_notification"], "AIML_API"),
  def("RemediationAgent", "Remediation Agent", "RemediationAgent", "Response", ["containment", "remediation"], "AIML_API"),
  def("ExecutiveStrategyAgent", "Executive Strategy Agent", "ExecutiveStrategyAgent", "Response", ["executive_decisions", "report_generation"], "AIML_API"),
];

// Tier 1
export class SecurityMonitoringAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[0];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a security monitoring agent.", `Analyze alerts: ${JSON.stringify(input)}`, true);
    return JSON.parse(result.text || "{}");
  }
}

export class ThreatIntelligenceAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[1];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a threat intelligence agent.", `Correlate IOCs: ${JSON.stringify(input)}`, true);
    return JSON.parse(result.text || "{}");
  }
}

export class SocialIntelligenceAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[2];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a social intelligence agent.", `Analyze social signals: ${JSON.stringify(input)}`, true);
    return JSON.parse(result.text || "{}");
  }
}

// Tier 2
export class IncidentCommanderAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[3];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI(
      "You are an incident commander. Orchestrate investigation and agent recruitment.",
      `Incident context: ${JSON.stringify(input)}`,
      true
    );
    try { return JSON.parse(result.text || "{}"); } catch { return { plan: result.text }; }
  }
}

export class DigitalForensicsAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[4];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a digital forensics agent.", `Analyze forensic data: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { findings: result.text }; }
  }
}

export class CommunicationAnalysisAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[5];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a communication analysis agent.", `Build comms timeline: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { timeline: result.text }; }
  }
}

export class FinancialForensicsAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[6];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a financial forensics agent.", `Analyze transactions: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { transactions: result.text }; }
  }
}

export class IdentityInvestigationAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[7];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are an identity investigation agent.", `Investigate identity: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { identity: result.text }; }
  }
}

export class TimelineReconstructionAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[8];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a timeline reconstruction agent.", `Reconstruct timeline: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { events: result.text }; }
  }
}

// Tier 3
export class CorrelationAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[9];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a correlation agent.", `Correlate evidence: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { correlations: result.text }; }
  }
}

export class RootCauseAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[10];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a root cause agent.", `Determine root cause: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { rootCause: result.text }; }
  }
}

export class ImpactAnalysisAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[11];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are an impact analysis agent.", `Assess impact: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { impact: result.text }; }
  }
}

export class FutureRiskSimulationAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[12];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a future risk simulation agent.", `Simulate scenarios: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { scenarios: result.text }; }
  }
}

// Tier 4
export class ComplianceAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[13];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI(
      "You are a compliance agent. Check GDPR, SOC2, ISO 27001, internal policy.",
      `Review compliance: ${JSON.stringify(input)}`,
      true
    );
    try { return JSON.parse(result.text || "{}"); } catch { return { findings: result.text }; }
  }
}

export class LegalAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[14];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a legal agent.", `Legal review: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { legal: result.text }; }
  }
}

export class AuditAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[15];
  async analyze(input: Record<string, unknown>) {
    await this.logAudit("audit_review", input);
    return { audited: true, recordCount: Object.keys(input).length, timestamp: new Date().toISOString() };
  }
}

// Tier 5
export class PRResponseAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[16];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a PR response agent.", `Draft PR strategy: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { strategy: result.text }; }
  }
}

export class CustomerCommunicationAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[17];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a customer communication agent.", `Draft customer comms: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { message: result.text }; }
  }
}

export class RemediationAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[18];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are a remediation agent.", `Plan remediation: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { plan: result.text }; }
  }
}

export class ExecutiveStrategyAgent extends BaseAgent {
  definition = AGENT_DEFINITIONS[19];
  async analyze(input: Record<string, unknown>) {
    const result = await this.invokeAI("You are an executive strategy agent.", `Generate recommendation: ${JSON.stringify(input)}`, true);
    try { return JSON.parse(result.text || "{}"); } catch { return { recommendation: result.text }; }
  }
}
