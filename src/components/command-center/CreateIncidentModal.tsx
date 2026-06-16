"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Plus } from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import { fetchJsonWithRetry } from "@/lib/http/retry";

const INCIDENT_TYPES = [
  "Vendor Fraud",
  "Data Breach",
  "Ransomware Attack",
  "Brand Reputation Crisis",
  "Identity Theft",
  "Service Outage",
] as const;

const SEVERITIES = ["critical", "high", "medium", "low"] as const;

export interface CreatedIncident {
  id: string;
  title: string;
  status: string;
  severity: "critical" | "high" | "medium" | "low";
}

interface CreateIncidentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (incident: CreatedIncident) => void;
}

export function CreateIncidentModal({ open, onClose, onCreated }: CreateIncidentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>(INCIDENT_TYPES[0]);
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>("high");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setType(INCIDENT_TYPES[0]);
    setSeverity("high");
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (trimmedTitle.length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (trimmedDescription.length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await fetchJsonWithRetry<{
        incident: CreatedIncident;
      }>(
        "/api/incidents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: trimmedTitle,
            description: trimmedDescription,
            type,
            severity,
          }),
        },
        { timeoutMs: 30_000, retries: 1 }
      );
      onCreated(result.incident);
      reset();
      onClose();
      // Agents continue investigating in the background for ~30-60s.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create incident.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-premium hud-panel relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-cyan-500/25 p-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15">
                <Plus className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">New Incident</h3>
                <p className="font-mono text-[10px] text-slate-500">Agents start investigating automatically</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-500">Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Suspicious vendor payment detected"
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 font-mono text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
                  disabled={submitting}
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-500">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What happened? Include key details for the investigation agents."
                  rows={3}
                  className="w-full resize-none rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 font-mono text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/40"
                  disabled={submitting}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-500">Type</span>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-2 py-2 font-mono text-xs text-white outline-none focus:border-cyan-500/40"
                    disabled={submitting}
                  >
                    {INCIDENT_TYPES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-500">Severity</span>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as (typeof SEVERITIES)[number])}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-2 py-2 font-mono text-xs text-white outline-none focus:border-cyan-500/40"
                    disabled={submitting}
                  >
                    {SEVERITIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-[11px] text-red-200">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <NeonButton variant="ghost" size="sm" onClick={handleClose} disabled={submitting} className="flex-1">
                Cancel
              </NeonButton>
              <NeonButton size="sm" onClick={() => void handleSubmit()} disabled={submitting} className="flex-1">
                {submitting ? "Creating..." : "Create & Investigate"}
              </NeonButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
