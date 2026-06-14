export type BusinessDomain = "Cybersecurity" | "Finance" | "Compliance" | "Supply Chain" | "Operations" | "Reputation";

export type CrisisType =
  | "Data Breach"
  | "Ransomware Attack"
  | "Insider Threat"
  | "Vendor Fraud"
  | "Financial Irregularity"
  | "Compliance Violation"
  | "Service Outage"
  | "Product Recall"
  | "Brand Reputation Crisis"
  | "Cloud Misconfiguration"
  | "API Compromise"
  | "Credential Leak"
  | "Supply Chain Attack";

export type MessageType =
  | "CONTEXT_SHARE"
  | "TASK_HANDOFF"
  | "EVIDENCE_SUBMISSION"
  | "REVIEW_REQUEST"
  | "APPROVAL_REQUEST"
  | "DECISION"
  | "AGENT_RECRUITMENT"
  | "RISK_UPDATE";

export type AgentTier =
  | "Detection"
  | "Investigation"
  | "Intelligence"
  | "Governance"
  | "Response";

export type Severity = "critical" | "high" | "medium" | "low";

export type AgentStatus = "active" | "idle" | "recruiting" | "waiting" | "completed";

export interface Agent {
  id: string;
  name: string;
  tier: AgentTier;
  role: string;
  status: AgentStatus;
  color: string;
  description?: string;
}

export interface BandMessage {
  id: string;
  from: string;
  to: string;
  type: MessageType;
  content: string;
  timestamp: string;
  metadata?: Record<string, string | number>;
}

export interface Incident {
  id: string;
  title: string;
  type: CrisisType;
  severity: Severity;
  status: "investigating" | "contained" | "escalated" | "resolved" | "pending_approval";
  riskScore: number;
  createdAt: string;
  roomId: string;
}

export interface EvidenceNode {
  id: string;
  label: string;
  type: string;
  confidence: number;
  sourceAgent: string;
  timestamp: string;
  riskLevel: Severity;
  description: string;
}

export interface EvidenceEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: "server" | "cloud" | "device" | "vendor" | "gateway" | "database" | "identity" | "portal";
  position: [number, number, number];
  threatLevel: number;
  activeAgent?: string;
}

export interface RiskScenario {
  id: string;
  title: string;
  description: string;
  impacts: {
    financial: number;
    legal: number;
    compliance: number;
    reputation: number;
    downtime: number;
    customer: number;
  };
  recommendation: string;
  confidence: number;
  agentNote: string;
}

export interface RiskBreakdown {
  threatSeverity: number;
  financialExposure: number;
  complianceExposure: number;
  vendorRisk: number;
  operationalImpact: number;
  reputationImpact: number;
}

export interface DecisionOption {
  id: string;
  label: string;
  rank: number;
  recommended: boolean;
  confidence: number;
  expectedSavings: number;
  impacts: {
    financial: number;
    compliance: number;
    legal: number;
    operational: number;
    customer: number;
    reputation: number;
  };
  agentSupport: string[];
  agentOpposition: string[];
  rationale: string;
}

export interface ApprovalChainStep {
  id: string;
  role: string;
  name: string;
  status: "approved" | "pending" | "rejected" | "escalated";
  timestamp: string | null;
  note: string | null;
}

export interface IntelligenceSignal {
  id: string;
  source: string;
  agent: string;
  signal: string;
  severity: Severity;
  timestamp: string;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: string;
  uploaded: string;
  tags: string[];
}

export interface ExecutiveRecommendation {
  action: string;
  reason: string;
  expectedSavings: number;
  complianceImpact: string;
  operationalImpact: string;
  legalExposure: string;
  confidence: number;
  ranking: string[];
}

export interface Tenant {
  id: string;
  name: string;
  industry: string;
  region: string;
}

export interface ApprovalRequest {
  id: string;
  action: string;
  risk: Severity;
  recommendation: "Approve" | "Reject" | "Escalate";
  requestedBy: string;
  status: "pending" | "approved" | "rejected" | "escalated";
}

export interface ComplianceFinding {
  framework: "GDPR" | "SOC2" | "ISO 27001" | "Internal Policy";
  status: "compliant" | "at_risk" | "violation";
  findings: string[];
  requiredActions: string[];
  disclosureRequired: boolean;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  agent?: string;
  type: "detection" | "investigation" | "evidence" | "approval" | "decision" | "recruitment";
}
