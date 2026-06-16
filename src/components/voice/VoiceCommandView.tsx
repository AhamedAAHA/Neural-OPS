"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { useVoiceStore, useNeuralOpsStore } from "@/store/neural-ops";
import { fetchJsonWithRetry } from "@/lib/http/retry";
import { Mic, MicOff, ArrowRight, Radio, Bot } from "lucide-react";

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

const VOICE_EXAMPLES = [
  "Start investigation for vendor fraud",
  "Show open incidents",
  "Generate executive report",
  "Request legal review",
];

export function VoiceCommandView() {
  const { isListening, transcript, waveform, setListening, setTranscript, setWaveform } = useVoiceStore();
  const { selectedIncidentId } = useNeuralOpsStore();
  const [routedAgent, setRoutedAgent] = useState("Unassigned");
  const [intent, setIntent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [flow, setFlow] = useState<Array<{ step: string; action: string }>>([]);

  const recognitionSupported = useMemo(() => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window), []);

  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(() => {
      setWaveform(Array.from({ length: 32 }, () => 0.1 + Math.random() * 0.9));
    }, 100);
    return () => clearInterval(interval);
  }, [isListening, setWaveform]);

  const submitTranscript = async (text: string) => {
    if (!text.trim()) return;
    setProcessing(true);
    setError(null);
    try {
      const result = await fetchJsonWithRetry<{
        intent?: string;
        routedAgentRole?: string;
        result?: { summary?: string; incidentId?: string };
      }>("/api/voice/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, incidentId: selectedIncidentId ?? undefined }),
      });
      setIntent(result.intent ?? "UNKNOWN");
      setRoutedAgent(result.routedAgentRole ?? "Incident Commander Agent");
      setFlow([
        { step: "Speechmatics", action: "Transcript captured" },
        { step: "Intent Classifier", action: result.intent ?? "UNKNOWN" },
        { step: "Band Router", action: `Routed to ${result.routedAgentRole ?? "command chain"}` },
        { step: "Operations", action: result.result?.summary ?? "Command executed" },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice command failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleListen = () => {
    if (isListening) {
      setListening(false);
      if (transcript.trim()) void submitTranscript(transcript);
      return;
    }

    if (!recognitionSupported) {
      setError("Browser speech recognition is unavailable. Type a command below.");
      setListening(true);
      return;
    }

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const text = Array.from(event.results).map((result) => result[0].transcript).join(" ");
      setTranscript(text);
    };
    recognition.onerror = () => setError("Speech capture failed.");
    recognition.onend = () => setListening(false);
    setListening(true);
    setTranscript("");
    recognition.start();
  };

  return (
    <AppShell title="Voice Operations Center" subtitle="Speechmatics · Voice Investigation · Band Routing">
      <div className="grid h-[calc(100vh-5.5rem)] min-h-0 grid-cols-12 gap-2 overflow-hidden">
        <ScrollArea className="col-span-5 flex flex-col gap-2 pr-1">
          <CyberPanel title="Live Transcript" glow="cyan" className="flex-1">
            <div className="mb-4 flex h-16 items-center justify-center gap-1">
              {waveform.map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: isListening ? `${h * 48}px` : "4px" }}
                  className="w-1 rounded-full bg-cyan-500/60"
                  transition={{ duration: 0.1 }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleListen}
              disabled={processing}
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all ${
                isListening
                  ? "animate-pulse border-red-500/50 bg-red-500/20 text-red-400"
                  : "border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:glow-active"
              }`}
            >
              {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder={isListening ? "Listening..." : "Speak or type an operations command"}
              className="mb-3 min-h-[80px] w-full rounded border border-cyan-500/15 bg-black/40 p-4 font-mono text-sm text-cyan-300 outline-none"
            />
            <NeonButton className="w-full justify-center" onClick={() => void submitTranscript(transcript)} disabled={processing || !transcript.trim()}>
              {processing ? "Routing..." : "Execute Voice Command"}
            </NeonButton>
            <CyberBadge label={recognitionSupported ? "Speechmatics-ready browser capture" : "Manual transcript mode"} variant="amber" />
            {error && <p className="mt-2 font-mono text-[10px] text-red-400">{error}</p>}
          </CyberPanel>

          <CyberPanel title="Voice Examples" compact>
            <div className="space-y-1.5">
              {VOICE_EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => setTranscript(ex)} className="w-full rounded border border-white/5 p-2 text-left font-mono text-[10px] text-slate-400 hover:border-cyan-500/20 hover:text-cyan-300">
                  {ex}
                </button>
              ))}
            </div>
          </CyberPanel>
        </ScrollArea>

        <div className="col-span-7 flex min-h-0 flex-col gap-2 overflow-hidden">
          <CyberPanel title="Routing Result" glow="violet">
            <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
              <div><span className="text-slate-600">Intent </span><span className="text-cyan-300">{intent || "—"}</span></div>
              <div><span className="text-slate-600">Routed Agent </span><span className="text-violet-300">{routedAgent}</span></div>
            </div>
          </CyberPanel>

          <CyberPanel title="Execution Flow" glow="cyan" className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-1">
              {flow.map((item, i) => (
                <div key={`${item.step}-${i}`} className="flex items-center gap-3 rounded border border-white/5 p-3">
                  <Radio className="h-4 w-4 text-cyan-400" />
                  <div>
                    <div className="font-mono text-xs text-white">{item.step}</div>
                    <div className="font-mono text-[10px] text-slate-500">{item.action}</div>
                  </div>
                  {i < flow.length - 1 && <ArrowRight className="ml-auto h-3 w-3 text-slate-600" />}
                </div>
              ))}
              {!flow.length && <p className="font-mono text-[10px] text-slate-600">Execute a voice command to see live routing.</p>}
              </div>
            </ScrollArea>
            <div className="mt-4 flex items-center gap-2 font-mono text-[10px] text-slate-500">
              <Bot className="h-3.5 w-3.5 text-cyan-400" />
              Commands are persisted to audit logs and routed through Band agents.
            </div>
          </CyberPanel>
        </div>
      </div>
    </AppShell>
  );
}
