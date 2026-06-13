import { z } from "zod";

export const createIncidentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  type: z.string().min(2),
  severity: z.enum(["critical", "high", "medium", "low"]),
});

export const recruitAgentSchema = z.object({
  roomId: z.string(),
  agentRole: z.string(),
  incidentId: z.string(),
});

export const agentMessageSchema = z.object({
  roomId: z.string(),
  fromAgentId: z.string(),
  toAgentId: z.string().nullable().optional(),
  messageType: z.enum([
    "CONTEXT_SHARE", "TASK_HANDOFF", "EVIDENCE_SUBMISSION", "REVIEW_REQUEST",
    "APPROVAL_REQUEST", "DECISION", "AGENT_RECRUITMENT", "RISK_UPDATE", "VOICE_COMMAND",
  ]),
  incidentId: z.string(),
  summary: z.string(),
  payload: z.record(z.string(), z.unknown()).default({}),
  requiredAction: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const handoffSchema = z.object({
  roomId: z.string(),
  fromAgentId: z.string(),
  toAgentId: z.string(),
  taskTitle: z.string(),
  taskPayload: z.record(z.string(), z.unknown()).default({}),
  incidentId: z.string(),
});

export const evidenceSchema = z.object({
  incidentId: z.string(),
  sourceAgentId: z.string(),
  evidenceType: z.string(),
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
  sourceReference: z.string().optional(),
  bandMessageId: z.string().optional(),
});

export const riskAnalyzeSchema = z.object({
  incidentId: z.string(),
  agentId: z.string().optional(),
});

export const riskSimulateSchema = z.object({
  incidentId: z.string(),
  scenario: z.string(),
  scenarioDescription: z.string().optional(),
});

export const complianceReviewSchema = z.object({
  incidentId: z.string(),
  regulations: z.array(z.string()).default(["GDPR", "SOC2", "ISO 27001", "Internal Policy"]),
});

export const legalReviewSchema = z.object({
  incidentId: z.string(),
});

export const approvalRequestSchema = z.object({
  incidentId: z.string(),
  requestedByAgentId: z.string(),
  actionTitle: z.string(),
  actionDescription: z.string(),
  riskLevel: z.enum(["critical", "high", "medium", "low"]),
});

export const approvalRespondSchema = z.object({
  decision: z.enum(["approved", "rejected", "escalated"]),
  decisionNote: z.string().optional(),
});

export const reportGenerateSchema = z.object({
  incidentId: z.string(),
});

export const aiCompleteSchema = z.object({
  system: z.string(),
  prompt: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  responseFormat: z.enum(["text", "json"]).optional(),
  provider: z.enum(["AIML_API", "FEATHERLESS", "OPENAI", "LOCAL"]).optional(),
  agentId: z.string().optional(),
  incidentId: z.string().optional(),
});

export const voiceCommandSchema = z.object({
  transcript: z.string().min(3),
  incidentId: z.string().optional(),
});

export const broadcastSchema = z.object({
  incidentId: z.string(),
  summary: z.string(),
  payload: z.record(z.string(), z.unknown()).default({}),
  fromAgentId: z.string(),
});
