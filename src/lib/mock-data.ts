import type {
  Agent,
  ApprovalRequest,
  BandMessage,
  ComplianceFinding,
  EvidenceEdge,
  EvidenceNode,
  Incident,
  NetworkNode,
  RiskScenario,
  TimelineEvent,
} from "./types";

export const DEMO_INCIDENT: Incident = {
  id: "INC-2026-0847",
  title: "Vendor ABC Suspected Fraud",
  type: "Vendor Fraud",
  severity: "critical",
  status: "pending_approval",
  riskScore: 87,
  createdAt: "2026-06-14T08:42:00Z",
  roomId: "ROOM-VABC-001",
};

export const INCIDENTS: Incident[] = [
  DEMO_INCIDENT,
  {
    id: "INC-2026-0831",
    title: "Cloud Misconfiguration — S3 Bucket",
    type: "Cloud Misconfiguration",
    severity: "high",
    status: "investigating",
    riskScore: 62,
    createdAt: "2026-06-13T14:20:00Z",
    roomId: "ROOM-CLOUD-012",
  },
  {
    id: "INC-2026-0819",
    title: "Credential Leak — Admin Portal",
    type: "Credential Leak",
    severity: "medium",
    status: "contained",
    riskScore: 45,
    createdAt: "2026-06-12T09:15:00Z",
    roomId: "ROOM-CRED-008",
  },
];

export const AGENTS: Agent[] = [
  { id: "ic", name: "Incident Commander", tier: "Investigation", role: "Orchestration", status: "active", color: "#22d3ee", description: "Creates investigation rooms and recruits specialists" },
  { id: "df", name: "Digital Forensics", tier: "Investigation", role: "Forensics", status: "active", color: "#a78bfa", description: "Analyzes logs, devices, and access patterns" },
  { id: "id", name: "Identity Investigation", tier: "Investigation", role: "Identity", status: "active", color: "#818cf8", description: "Investigates privilege abuse and account anomalies" },
  { id: "ff", name: "Financial Forensics", tier: "Investigation", role: "Finance", status: "active", color: "#fbbf24", description: "Traces payments and financial irregularities" },
  { id: "ca", name: "Communication Analysis", tier: "Investigation", role: "Comms", status: "active", color: "#34d399", description: "Builds communication timelines" },
  { id: "cp", name: "Compliance Agent", tier: "Governance", role: "Compliance", status: "active", color: "#2dd4bf", description: "Flags GDPR, SOC2, ISO 27001 risks" },
  { id: "lg", name: "Legal Agent", tier: "Governance", role: "Legal", status: "waiting", color: "#f87171", description: "Requests human approval for critical actions" },
  { id: "rs", name: "Future Risk Simulation", tier: "Intelligence", role: "Risk", status: "active", color: "#fb923c", description: "Simulates outcomes before decisions" },
  { id: "es", name: "Executive Strategy", tier: "Response", role: "Executive", status: "waiting", color: "#e879f9", description: "Generates executive recommendations" },
  { id: "au", name: "Audit Agent", tier: "Governance", role: "Audit", status: "completed", color: "#94a3b8", description: "Records all agent actions and decisions" },
  { id: "sm", name: "Security Monitoring", tier: "Detection", role: "Detection", status: "idle", color: "#38bdf8", description: "Continuous threat detection" },
  { id: "ti", name: "Threat Intelligence", tier: "Detection", role: "Intel", status: "idle", color: "#60a5fa", description: "External threat correlation" },
];

export const BAND_MESSAGES: BandMessage[] = [
  { id: "m1", from: "Incident Commander", to: "System", type: "AGENT_RECRUITMENT", content: "Investigation room ROOM-VABC-001 created for Vendor ABC suspected fraud.", timestamp: "2026-06-14T08:42:12Z" },
  { id: "m2", from: "Incident Commander", to: "Digital Forensics", type: "AGENT_RECRUITMENT", content: "Recruiting Digital Forensics Agent for vendor payment trail analysis.", timestamp: "2026-06-14T08:43:01Z" },
  { id: "m3", from: "Digital Forensics", to: "Identity Investigation", type: "TASK_HANDOFF", content: "Found unusual login from Finance Manager account at 02:14 UTC. Requesting identity investigation.", timestamp: "2026-06-14T08:51:33Z" },
  { id: "m4", from: "Identity Investigation", to: "Incident Commander", type: "EVIDENCE_SUBMISSION", content: "Confirmed privilege abuse — Finance Manager credentials used to approve Vendor ABC invoice #INV-9847.", timestamp: "2026-06-14T09:02:18Z", metadata: { confidence: 94 } },
  { id: "m5", from: "Financial Forensics", to: "Communication Analysis", type: "CONTEXT_SHARE", content: "Detected suspicious vendor payment of $847,000 to Vendor ABC. 3 prior invoices flagged as anomalous.", timestamp: "2026-06-14T09:08:44Z" },
  { id: "m6", from: "Communication Analysis", to: "Incident Commander", type: "EVIDENCE_SUBMISSION", content: "Email thread between Finance Manager and Vendor ABC contact shows pre-approval coordination.", timestamp: "2026-06-14T09:15:22Z", metadata: { confidence: 89 } },
  { id: "m7", from: "Compliance Agent", to: "Legal Agent", type: "REVIEW_REQUEST", content: "GDPR Art. 33 breach notification may be required. SOC2 CC6.1 access control violation detected. ISO 27001 A.9.2.3 non-compliance.", timestamp: "2026-06-14T09:22:07Z" },
  { id: "m8", from: "Future Risk Simulation", to: "Executive Strategy", type: "RISK_UPDATE", content: "Fraud probability: 91%. Estimated financial exposure: $2.4M. Reputation risk: High if public disclosure delayed.", timestamp: "2026-06-14T09:28:55Z", metadata: { confidence: 91 } },
  { id: "m9", from: "Legal Agent", to: "Human Executive", type: "APPROVAL_REQUEST", content: "Critical action requires approval: Freeze vendor payments and notify affected stakeholders.", timestamp: "2026-06-14T09:35:41Z" },
  { id: "m10", from: "Executive Strategy", to: "Human Executive", type: "DECISION", content: "Awaiting final human decision. Recommended: Approve freeze + initiate forensic audit + prepare disclosure.", timestamp: "2026-06-14T09:40:00Z" },
  { id: "m11", from: "Audit Agent", to: "System", type: "CONTEXT_SHARE", content: "All agent actions recorded. 47 evidence items catalogued. Full audit trail available for executive report.", timestamp: "2026-06-14T09:41:15Z" },
];

export const NETWORK_NODES: NetworkNode[] = [
  { id: "db", label: "Cloud Database", type: "database", position: [0, 2, 0], threatLevel: 0.7, activeAgent: "Digital Forensics" },
  { id: "cloud", label: "Cloud Infrastructure", type: "cloud", position: [-3, 1, 1], threatLevel: 0.3 },
  { id: "device", label: "Employee Device", type: "device", position: [3, 0.5, -1], threatLevel: 0.85, activeAgent: "Identity Investigation" },
  { id: "vendor", label: "Vendor System", type: "vendor", position: [-2, -1, -2], threatLevel: 0.95, activeAgent: "Financial Forensics" },
  { id: "payment", label: "Payment Gateway", type: "gateway", position: [2, -0.5, 2], threatLevel: 0.9, activeAgent: "Financial Forensics" },
  { id: "portal", label: "Customer Portal", type: "portal", position: [0, -2, 1], threatLevel: 0.2 },
  { id: "api", label: "API Gateway", type: "gateway", position: [-3, -1, 2], threatLevel: 0.4 },
  { id: "finance", label: "Finance Server", type: "server", position: [3, 1.5, 1], threatLevel: 0.8, activeAgent: "Financial Forensics" },
  { id: "identity", label: "Identity Provider", type: "identity", position: [1, 2.5, -2], threatLevel: 0.75, activeAgent: "Identity Investigation" },
];

export const EVIDENCE_NODES: EvidenceNode[] = [
  { id: "vendor-abc", label: "Vendor ABC", type: "entity", confidence: 95, sourceAgent: "Financial Forensics", timestamp: "2026-06-14T09:08:44Z", riskLevel: "critical", description: "Third-party vendor with 3 anomalous invoices totaling $847K" },
  { id: "invoice", label: "Suspicious Invoice", type: "document", confidence: 92, sourceAgent: "Financial Forensics", timestamp: "2026-06-14T09:08:44Z", riskLevel: "critical", description: "Invoice #INV-9847 for $847,000 with irregular approval chain" },
  { id: "finance-mgr", label: "Finance Manager", type: "person", confidence: 89, sourceAgent: "Identity Investigation", timestamp: "2026-06-14T09:02:18Z", riskLevel: "high", description: "Account used for unauthorized invoice approval at 02:14 UTC" },
  { id: "payment-gw", label: "Payment Gateway", type: "system", confidence: 88, sourceAgent: "Financial Forensics", timestamp: "2026-06-14T09:10:00Z", riskLevel: "high", description: "Wire transfer initiated to Vendor ABC offshore account" },
  { id: "email", label: "Email Thread", type: "communication", confidence: 91, sourceAgent: "Communication Analysis", timestamp: "2026-06-14T09:15:22Z", riskLevel: "high", description: "Pre-approval coordination emails between Finance Manager and vendor contact" },
  { id: "cloud-db", label: "Cloud Database", type: "system", confidence: 78, sourceAgent: "Digital Forensics", timestamp: "2026-06-14T08:51:33Z", riskLevel: "medium", description: "Access logs show bulk export of vendor records" },
  { id: "login", label: "Login Event", type: "event", confidence: 94, sourceAgent: "Digital Forensics", timestamp: "2026-06-14T08:51:33Z", riskLevel: "critical", description: "Anomalous login from unrecognized IP geolocation" },
  { id: "device", label: "Employee Device", type: "device", confidence: 82, sourceAgent: "Digital Forensics", timestamp: "2026-06-14T08:55:00Z", riskLevel: "medium", description: "Finance Manager laptop — VPN bypass detected" },
  { id: "admin", label: "Admin Account", type: "account", confidence: 90, sourceAgent: "Identity Investigation", timestamp: "2026-06-14T09:02:18Z", riskLevel: "critical", description: "Elevated privileges used outside business hours" },
  { id: "records", label: "Customer Records", type: "data", confidence: 65, sourceAgent: "Compliance Agent", timestamp: "2026-06-14T09:22:07Z", riskLevel: "medium", description: "Potential GDPR exposure — vendor records contain PII" },
  { id: "firewall", label: "Firewall Alert", type: "alert", confidence: 72, sourceAgent: "Security Monitoring", timestamp: "2026-06-14T08:42:00Z", riskLevel: "medium", description: "Outbound data transfer spike to vendor IP range" },
  { id: "policy", label: "Compliance Policy", type: "policy", confidence: 98, sourceAgent: "Compliance Agent", timestamp: "2026-06-14T09:22:07Z", riskLevel: "high", description: "SOC2 CC6.1 and ISO 27001 A.9.2.3 violations identified" },
  { id: "legal", label: "Legal Risk", type: "assessment", confidence: 85, sourceAgent: "Legal Agent", timestamp: "2026-06-14T09:35:41Z", riskLevel: "high", description: "Potential securities fraud implications — disclosure may be required" },
];

export const EVIDENCE_EDGES: EvidenceEdge[] = [
  { id: "e1", source: "finance-mgr", target: "invoice", label: "approved" },
  { id: "e2", source: "invoice", target: "vendor-abc", label: "paid" },
  { id: "e3", source: "payment-gw", target: "vendor-abc", label: "paid" },
  { id: "e4", source: "finance-mgr", target: "email", label: "contacted" },
  { id: "e5", source: "email", target: "vendor-abc", label: "linked-to" },
  { id: "e6", source: "login", target: "admin", label: "accessed" },
  { id: "e7", source: "admin", target: "cloud-db", label: "accessed" },
  { id: "e8", source: "device", target: "login", label: "compromised" },
  { id: "e9", source: "firewall", target: "vendor-abc", label: "escalated" },
  { id: "e10", source: "cloud-db", target: "records", label: "accessed" },
  { id: "e11", source: "policy", target: "records", label: "violated" },
  { id: "e12", source: "legal", target: "policy", label: "reviewed" },
  { id: "e13", source: "finance-mgr", target: "payment-gw", label: "approved" },
];

export const RISK_SCENARIOS: RiskScenario[] = [
  { id: "ignore", title: "Ignore Incident", description: "Take no immediate action and monitor", impacts: { financial: 2400000, legal: 95, compliance: 90, reputation: 85, downtime: 10, customer: 70 }, recommendation: "Strongly not recommended", confidence: 97, agentNote: "Future Risk Simulation Agent: Fraud probability increases to 98% within 72 hours. Estimated total exposure: $4.2M." },
  { id: "shutdown", title: "Shutdown Affected Systems", description: "Isolate finance and payment systems immediately", impacts: { financial: 450000, legal: 40, compliance: 30, reputation: 25, downtime: 85, customer: 35 }, recommendation: "Partial — isolate payment gateway only", confidence: 88, agentNote: "Full shutdown causes $450K operational loss. Targeted isolation recommended." },
  { id: "notify", title: "Notify Customers", description: "Send breach notification to affected customers", impacts: { financial: 320000, legal: 25, compliance: 15, reputation: 45, downtime: 5, customer: 60 }, recommendation: "Approve after legal review", confidence: 82, agentNote: "GDPR Art. 33 requires notification within 72 hours if PII confirmed exposed." },
  { id: "legal", title: "Escalate to Legal", description: "Engage external legal counsel immediately", impacts: { financial: 180000, legal: 10, compliance: 20, reputation: 30, downtime: 5, customer: 15 }, recommendation: "Approve immediately", confidence: 94, agentNote: "Legal Agent: Securities fraud implications require counsel within 24 hours." },
  { id: "freeze", title: "Freeze Vendor Payments", description: "Block all payments to Vendor ABC", impacts: { financial: 120000, legal: 15, compliance: 10, reputation: 20, downtime: 15, customer: 10 }, recommendation: "Approve — highest priority", confidence: 96, agentNote: "Prevents additional $847K+ exposure. Minimal operational impact." },
  { id: "rotate", title: "Rotate Compromised Credentials", description: "Force reset Finance Manager and admin credentials", impacts: { financial: 25000, legal: 20, compliance: 15, reputation: 15, downtime: 20, customer: 5 }, recommendation: "Approve immediately", confidence: 93, agentNote: "Identity Investigation Agent: Confirmed privilege abuse — credential rotation critical." },
  { id: "pr", title: "Launch PR Response", description: "Prepare public statement and media strategy", impacts: { financial: 95000, legal: 35, compliance: 25, reputation: 55, downtime: 0, customer: 40 }, recommendation: "Defer until legal approval", confidence: 78, agentNote: "PR Agent: Premature disclosure may increase reputation damage. Coordinate with Legal." },
  { id: "audit", title: "Start Forensic Audit", description: "Engage external forensic auditors", impacts: { financial: 220000, legal: 15, compliance: 5, reputation: 25, downtime: 10, customer: 10 }, recommendation: "Approve", confidence: 91, agentNote: "Audit Agent: Required for regulatory compliance and insurance claims." },
];

export const APPROVAL_REQUEST: ApprovalRequest = {
  id: "APR-001",
  action: "Freeze vendor payments and notify affected stakeholders",
  risk: "high",
  recommendation: "Approve",
  requestedBy: "Legal Agent",
  status: "pending",
};

export const COMPLIANCE_FINDINGS: ComplianceFinding[] = [
  { framework: "GDPR", status: "at_risk", findings: ["Art. 33 — Potential breach notification required within 72 hours", "Art. 5 — Data integrity compromised via unauthorized vendor record access", "Art. 32 — Security measures inadequate for privileged account monitoring"], requiredActions: ["Conduct DPIA within 48 hours", "Prepare breach notification draft", "Implement enhanced access logging"], disclosureRequired: true },
  { framework: "SOC2", status: "violation", findings: ["CC6.1 — Logical access controls bypassed", "CC7.2 — Anomaly detection failed to alert on $847K payment", "CC8.1 — Change management process circumvented for vendor onboarding"], requiredActions: ["Remediate access control gaps", "Update anomaly detection thresholds", "Audit vendor onboarding process"], disclosureRequired: false },
  { framework: "ISO 27001", status: "violation", findings: ["A.9.2.3 — Privileged access management failure", "A.12.4.1 — Event logging gaps for finance systems", "A.15.1.1 — Supplier relationship security inadequate"], requiredActions: ["Implement PAM solution", "Enhance SIEM coverage for finance", "Conduct vendor security assessment"], disclosureRequired: false },
  { framework: "Internal Policy", status: "violation", findings: ["FIN-001 — Dual approval required for payments >$100K", "VND-003 — Vendor due diligence not completed for Vendor ABC", "SEC-012 — After-hours admin access requires MFA + approval"], requiredActions: ["Enforce dual approval workflow", "Complete vendor due diligence retroactively", "Enable conditional access policies"], disclosureRequired: false },
];

export const TIMELINE: TimelineEvent[] = [
  { id: "t1", time: "08:42", title: "Firewall alert — outbound data spike to vendor IP", agent: "Security Monitoring", type: "detection" },
  { id: "t2", time: "08:42", title: "Investigation room created", agent: "Incident Commander", type: "recruitment" },
  { id: "t3", time: "08:43", title: "Digital Forensics Agent recruited", agent: "Incident Commander", type: "recruitment" },
  { id: "t4", time: "08:51", title: "Unusual login detected — Finance Manager", agent: "Digital Forensics", type: "investigation" },
  { id: "t5", time: "09:02", title: "Privilege abuse confirmed", agent: "Identity Investigation", type: "evidence" },
  { id: "t6", time: "09:08", title: "Suspicious $847K payment identified", agent: "Financial Forensics", type: "evidence" },
  { id: "t7", time: "09:15", title: "Email coordination thread discovered", agent: "Communication Analysis", type: "evidence" },
  { id: "t8", time: "09:22", title: "GDPR/SOC2/ISO violations flagged", agent: "Compliance Agent", type: "investigation" },
  { id: "t9", time: "09:28", title: "Fraud probability: 91%", agent: "Future Risk Simulation", type: "decision" },
  { id: "t10", time: "09:35", title: "Human approval requested", agent: "Legal Agent", type: "approval" },
  { id: "t11", time: "09:40", title: "Executive decision pending", agent: "Executive Strategy", type: "decision" },
];

export const AGENT_TIERS = [
  {
    tier: "Tier 1: Detection Layer",
    agents: ["Security Monitoring Agent", "Threat Intelligence Agent", "Social Intelligence Agent"],
  },
  {
    tier: "Tier 2: Investigation Layer",
    agents: ["Incident Commander Agent", "Digital Forensics Agent", "Communication Analysis Agent", "Financial Forensics Agent", "Identity Investigation Agent", "Timeline Reconstruction Agent"],
  },
  {
    tier: "Tier 3: Intelligence Layer",
    agents: ["Correlation Agent", "Root Cause Agent", "Impact Analysis Agent", "Future Risk Simulation Agent"],
  },
  {
    tier: "Tier 4: Governance Layer",
    agents: ["Compliance Agent", "Legal Agent", "Audit Agent"],
  },
  {
    tier: "Tier 5: Response Layer",
    agents: ["PR Agent", "Customer Communication Agent", "Remediation Agent", "Executive Strategy Agent"],
  },
];
