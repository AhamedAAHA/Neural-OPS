"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, X, ArrowUpRight } from "lucide-react";
import { NeonButton } from "./NeonButton";
import type { ApprovalRequest } from "@/lib/types";

interface ApprovalModalProps {
  request: ApprovalRequest;
  open: boolean;
  onClose: () => void;
  onAction: (action: "approved" | "rejected" | "escalated") => void;
}

export function ApprovalModal({ request, open, onClose, onAction }: ApprovalModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong neon-border-cyan relative mx-4 w-full max-w-lg rounded-2xl p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Critical Action Requires Approval</h3>
                <p className="text-xs text-slate-400">Requested by {request.requestedBy}</p>
              </div>
            </div>

            <div className="mb-6 space-y-3 rounded-lg border border-white/10 bg-black/30 p-4 font-mono text-sm">
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

            <div className="flex gap-3">
              <NeonButton variant="primary" size="sm" onClick={() => onAction("approved")} className="flex-1">
                <Check className="h-4 w-4" /> Approve
              </NeonButton>
              <NeonButton variant="danger" size="sm" onClick={() => onAction("rejected")} className="flex-1">
                <X className="h-4 w-4" /> Reject
              </NeonButton>
              <NeonButton variant="secondary" size="sm" onClick={() => onAction("escalated")} className="flex-1">
                <ArrowUpRight className="h-4 w-4" /> Escalate
              </NeonButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
