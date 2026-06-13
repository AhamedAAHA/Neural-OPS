"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { useVoiceStore } from "@/store/neural-ops";
import { Mic, MicOff, ArrowRight, Radio, Bot } from "lucide-react";

const VOICE_EXAMPLES = [
  "Start investigation for Vendor ABC fraud",
  "Ask Compliance Agent to review GDPR exposure",
  "Generate executive report",
  "Escalate this incident to Legal Agent",
  "Request approval from executive",
];

const DEMO_FLOW = [
  { step: "Speechmatics", action: "Transcribe audio → text" },
  { step: "Intent Classifier", action: "CREATE_INCIDENT detected" },
  { step: "Band", action: "Room ROOM-VABC-001 created" },
  { step: "Incident Commander", action: "Recruits Financial Forensics Agent" },
];

export function VoiceCommandView() {
  const { isListening, transcript, waveform, setListening, setTranscript, setWaveform } = useVoiceStore();
  const [routedAgent, setRoutedAgent] = useState("Incident Commander Agent");

  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(() => {
      setWaveform(Array.from({ length: 32 }, () => 0.1 + Math.random() * 0.9));
    }, 100);
    return () => clearInterval(interval);
  }, [isListening, setWaveform]);

  const handleListen = () => {
    if (isListening) {
      setListening(false);
      setTranscript("Start investigation for Vendor ABC fraud");
      setRoutedAgent("Incident Commander Agent");
    } else {
      setListening(true);
      setTranscript("");
    }
  };

  return (
    <AppShell title="Voice Command Center" subtitle="Speechmatics · Intent Routing · Band Integration">
      <div className="grid h-[calc(100vh-5.5rem)] grid-cols-12 gap-2">
        <div className="col-span-5 flex flex-col gap-2">
          <CyberPanel title="Live Transcript" glow="cyan" className="flex-1">
            <div className="mb-4 flex items-center justify-center gap-1 h-16">
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
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all ${
                isListening
                  ? "animate-pulse border-red-500/50 bg-red-500/20 text-red-400"
                  : "border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:glow-active"
              }`}
            >
              {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
            <div className="rounded border border-cyan-500/15 bg-black/40 p-4 font-mono text-sm text-cyan-300 min-h-[80px]">
              {transcript || (isListening ? "Listening..." : "Press microphone to speak")}
              {isListening && <span className="animate-pulse">|</span>}
            </div>
            <CyberBadge label="Speechmatics API" variant="amber" />
          </CyberPanel>

          <CyberPanel title="Voice Examples" compact>
            <div className="space-y-1.5">
              {VOICE_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => { setTranscript(ex); setRoutedAgent(ex.includes("Compliance") ? "Compliance Agent" : ex.includes("Legal") ? "Legal Agent" : "Incident Commander Agent"); }}
                  className="w-full rounded border border-white/5 bg-white/[0.02] p-2 text-left font-mono text-[10px] text-slate-400 transition hover:border-cyan-500/20 hover:text-cyan-400"
                >
                  &gt; {ex}
                </button>
              ))}
            </div>
          </CyberPanel>
        </div>

        <div className="col-span-7 flex flex-col gap-2">
          <CyberPanel title="Intent → Agent Routing" glow="violet">
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-400">TRANSCRIPT</span>
              <ArrowRight className="h-4 w-4 text-slate-600" />
              <span className="rounded border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-violet-400">CREATE_INCIDENT</span>
              <ArrowRight className="h-4 w-4 text-slate-600" />
              <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-cyan-400">{routedAgent}</span>
              <ArrowRight className="h-4 w-4 text-slate-600" />
              <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-400">BAND</span>
            </div>
          </CyberPanel>

          <CyberPanel title="Demo Workflow" glow="emerald" className="flex-1">
            <div className="space-y-3">
              {DEMO_FLOW.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-center gap-3 rounded border border-white/5 bg-white/[0.02] p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded border border-cyan-500/20 font-mono text-xs text-cyan-400">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-cyan-400">{item.step}</div>
                    <div className="font-mono text-xs text-slate-400">{item.action}</div>
                  </div>
                  {item.step === "Band" && <Radio className="ml-auto h-4 w-4 text-emerald-400 animate-pulse" />}
                  {item.step !== "Band" && item.step !== "Speechmatics" && <Bot className="ml-auto h-4 w-4 text-violet-400" />}
                </motion.div>
              ))}
            </div>
            <NeonButton href="/investigation" size="sm" className="mt-4">View Investigation Room</NeonButton>
          </CyberPanel>
        </div>
      </div>
    </AppShell>
  );
}
