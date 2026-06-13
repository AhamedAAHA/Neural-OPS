// Neural OPS — Unified service layer exports
export { createIncident, getIncidentDetails, listIncidents } from "./incident-service";
export { startInvestigationWorkflow } from "./workflow-service";
export {
  saveEvidence,
  getIncidentEvidence,
  recruitAgent,
  sendAgentMessage,
  createHandoff,
  getRoomMessages,
  broadcastToRoom,
  listAgents,
  getAgent,
} from "./agent-service";
export { analyzeRisk, simulateRisk } from "./risk-service";
export { reviewCompliance, reviewLegal } from "./compliance-service";
export { requestApproval, respondToApproval } from "./approval-service";
export { generateExecutiveReport, getReport } from "./report-service";
export { processVoiceTranscript, transcribeAudio } from "./voice-service";
export { AuditLogger, logAuditEvent, getAuditLogs } from "./audit-service";

// Aliased module names per architecture spec
export { createIncident as IncidentService_create } from "./incident-service";
export { getRoomMessages as RoomService_getMessages, broadcastToRoom as RoomService_broadcast } from "./agent-service";
export { recruitAgent as AgentOrchestrator_recruit, sendAgentMessage as BandService_send, createHandoff as BandService_handoff } from "./agent-service";
export { saveEvidence as EvidenceService_save, getIncidentEvidence as EvidenceService_list } from "./agent-service";
export { analyzeRisk as RiskService_analyze, simulateRisk as RiskService_simulate } from "./risk-service";
export { reviewCompliance as ComplianceService_review } from "./compliance-service";
export { reviewLegal as LegalService_review } from "./compliance-service";
export { requestApproval as ApprovalService_request, respondToApproval as ApprovalService_respond } from "./approval-service";
export { generateExecutiveReport as ReportService_generate, getReport as ReportService_get } from "./report-service";
export { processVoiceTranscript as VoiceCommandService_process, transcribeAudio as VoiceCommandService_transcribe } from "./voice-service";
export { broadcastEvent as RealtimeService_broadcast } from "../realtime/broadcaster";
export { getBandAdapter, MockBandAdapter, RealBandAdapter } from "../band";
export { AIProviderRouter } from "../ai/router";
export { SpeechmaticsService } from "../speechmatics";
