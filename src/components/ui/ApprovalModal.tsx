"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, X, ArrowUpRight } from "lucide-react";
import { NeonButton } from "./NeonButton";
import type { ApprovalRequest } from "@/lib/types";
import { useNeuralOpsStore } from "@/store/neural-ops";

interface ApprovalModalProps {
  request: ApprovalRequest;
  open: boolean;
  onClose: () => void;
  onAction: (action: "approved" | "rejected" | "escalated") => void;
}

export function ApprovalModal({ request, open, onClose, onAction }: ApprovalModalProps) {
  const { approvalChain, advanceApprovalStep } = useNeuralOpsStore();
  const currentStep = approvalChain.find((s) => s.status === "pending");

  const handleAction = (action: "approved" | "rejected" | "escalated") => {
    if (currentStep) advanceApprovalStep(currentStep.id, action);
    onAction(action);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-premium hud-panel scanlines neon-border-cyan relative mx-4 w-full max-w-lg rounded-2xl p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Enterprise Approval Chain</h3>
                <p className="text-xs text-slate-400">Requested by {request.requestedBy}</p>
              </div>
            </div>

            <div className="glass-packet mb-4 space-y-3 rounded-lg p-4 font-mono text-sm">
              <div>
                <span className="text-slate-500">Action: </span>
                <span className="text-cyan-300">{request.action}</span>
              </div>
              <div>
                <span className="text-slate-500">Risk: </span>
                <span className="text-red-400 uppercase">{request.risk}</span>
              </div>
              <div>
                <span className="text-slate-500">Recommendation: </span>
                <span className="text-emerald-400">{request.recommendation}</span>
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-violet-500/20 bg-violet-500/[0.03] p-3">
              <div className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-violet-300">Approval Chain</div>
              {approvalChain.map((step, i) => (
                <div key={step.id} className="flex items-center gap-2 py-0.5 font-mono text-[10px]">
                  <span className={`h-1.5 w-1.5 rounded-full ${step.status === "approved" ? "bg-emerald-400" : step.status === "pending" ? "bg-amber-400 animate-pulse" : "bg-slate-600"}`} />
                  <span className={step.id === currentStep?.id ? "font-medium text-white" : "text-slate-400"}>{step.role}</span>
                  <span className="ml-auto capitalize text-slate-600">{step.status}</span>
                  {i < approvalChain.length - 1 && <span className="text-slate-700">↓</span>}
                </div>
              ))}
              {currentStep && (
                <div className="mt-2 font-mono text-[10px] text-amber-400">Awaiting: {currentStep.role} ({currentStep.name})</div>
              )}
            </div>

            <div className="flex gap-3">
              <NeonButton variant="primary" size="sm" onClick={() => handleAction("approved")} className="flex-1">
                <Check className="h-4 w-4" /> Approve
              </NeonButton>
              <NeonButton variant="danger" size="sm" onClick={() => handleAction("rejected")} className="flex-1">
                <X className="h-4 w-4" /> Reject
              </NeonButton>
              <NeonButton variant="secondary" size="sm" onClick={() => handleAction("escalated")} className="flex-1">
                <ArrowUpRight className="h-4 w-4" /> Escalate
              </NeonButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
