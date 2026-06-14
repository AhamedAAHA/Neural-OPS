import { completeWithFallback } from "@/lib/ai/providers";
import { recordMonitoringEvent } from "@/lib/observability/store";

const ALLOWED_AUDIO_TYPES = ["audio/wav", "audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg"];
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  raw?: unknown;
}

export async function transcribeAudio(file: File): Promise<TranscriptionResult> {
  const started = Date.now();
  if (!ALLOWED_AUDIO_TYPES.includes(file.type) && !file.name.match(/\.(wav|mp3|mp4|webm|ogg|m4a)$/i)) {
    throw new Error("Unsupported audio format");
  }
  if (file.size > MAX_AUDIO_SIZE) {
    throw new Error("Audio file too large (max 10MB)");
  }

  const apiKey = process.env.SPEECHMATICS_API_KEY;
  if (!apiKey) {
    if (process.env.USE_MOCK_SPEECHMATICS === "true") {
      const mock = mockTranscribe(file.name);
      void recordMonitoringEvent({
        source: "SPEECHMATICS",
        operation: "speechmatics.transcribe",
        status: "mock",
        durationMs: Date.now() - started,
        details: { fileName: file.name, mode: "mock" },
      }).catch(() => {});
      return mock;
    }
    throw new Error("Speechmatics is not configured. Set SPEECHMATICS_API_KEY or USE_MOCK_SPEECHMATICS=true for local development.");
  }

  const buffer = await file.arrayBuffer();
  const res = await fetch("https://asr.api.speechmatics.com/v2/jobs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "transcription",
      transcription_config: {
        language: process.env.SPEECHMATICS_LANGUAGE ?? "en",
      },
      fetch_data: {
        url: `data:${file.type};base64,${Buffer.from(buffer).toString("base64")}`,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    void recordMonitoringEvent({
      source: "SPEECHMATICS",
      level: "error",
      operation: "speechmatics.transcribe",
      status: "error",
      durationMs: Date.now() - started,
      message: `HTTP ${res.status}`,
      details: { error: err.slice(0, 180) },
    }).catch(() => {});
    throw new Error(`Speechmatics error: ${err}`);
  }

  const job = await res.json();
  const transcript = await pollSpeechmaticsJob(apiKey, job.id, started);
  return transcript;
}

async function pollSpeechmaticsJob(apiKey: string, jobId: string, startedAt: number): Promise<TranscriptionResult> {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`https://asr.api.speechmatics.com/v2/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    if (data.job?.status === "done") {
      const text = data.results?.transcript ?? "";
      void recordMonitoringEvent({
        source: "SPEECHMATICS",
        operation: "speechmatics.transcribe",
        durationMs: Date.now() - startedAt,
        details: { jobId, status: "done", transcriptLength: text.length },
      }).catch(() => {});
      return { transcript: text, confidence: 0.9, raw: data };
    }
    if (data.job?.status === "rejected") {
      void recordMonitoringEvent({
        source: "SPEECHMATICS",
        level: "error",
        operation: "speechmatics.transcribe",
        status: "rejected",
        durationMs: Date.now() - startedAt,
        details: { jobId },
      }).catch(() => {});
      throw new Error("Speechmatics transcription rejected");
    }
  }
  void recordMonitoringEvent({
    source: "SPEECHMATICS",
    level: "error",
    operation: "speechmatics.transcribe",
    status: "timeout",
    durationMs: Date.now() - startedAt,
    details: { jobId },
  }).catch(() => {});
  throw new Error("Speechmatics transcription timeout");
}

function mockTranscribe(filename: string): TranscriptionResult {
  const samples = [
    "Start investigation for vendor fraud",
    "Ask Compliance Agent to review GDPR exposure",
    "Generate executive report",
    "Escalate this incident to Legal Agent",
    "Request approval from executive",
  ];
  const idx = filename.length % samples.length;
  return { transcript: samples[idx], confidence: 0.85 };
}

export async function classifyVoiceIntent(transcript: string): Promise<{ intent: string; confidence: number; routedAgentRole: string }> {
  const lower = transcript.toLowerCase();

  if (lower.includes("start investigation") || lower.includes("create incident")) {
    return { intent: "CREATE_INCIDENT", confidence: 0.9, routedAgentRole: "IncidentCommanderAgent" };
  }
  if (lower.includes("compliance") || lower.includes("gdpr") || lower.includes("soc2")) {
    return { intent: "COMPLIANCE_REVIEW", confidence: 0.88, routedAgentRole: "ComplianceAgent" };
  }
  if (lower.includes("executive report") || lower.includes("generate report")) {
    return { intent: "GENERATE_REPORT", confidence: 0.87, routedAgentRole: "ExecutiveStrategyAgent" };
  }
  if (lower.includes("escalate") && lower.includes("legal")) {
    return { intent: "ESCALATE_LEGAL", confidence: 0.86, routedAgentRole: "LegalAgent" };
  }
  if (lower.includes("approval") || lower.includes("approve")) {
    return { intent: "REQUEST_APPROVAL", confidence: 0.85, routedAgentRole: "LegalAgent" };
  }
  if (lower.includes("high severity") || lower.includes("show incidents")) {
    return { intent: "LIST_INCIDENTS", confidence: 0.8, routedAgentRole: "IncidentCommanderAgent" };
  }

  try {
    const result = await completeWithFallback("AIML_API", {
      system: "Classify voice command intent for enterprise security platform. Return JSON: { intent, confidence, routedAgentRole }",
      prompt: transcript,
      responseFormat: "json",
      temperature: 0.1,
    });
    const parsed = JSON.parse(result.text);
    return {
      intent: parsed.intent ?? "UNKNOWN",
      confidence: parsed.confidence ?? 0.5,
      routedAgentRole: parsed.routedAgentRole ?? "IncidentCommanderAgent",
    };
  } catch {
    return { intent: "UNKNOWN", confidence: 0.5, routedAgentRole: "IncidentCommanderAgent" };
  }
}
