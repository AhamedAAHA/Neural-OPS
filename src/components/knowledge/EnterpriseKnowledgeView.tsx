"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { FileText, Search, Brain, Upload, History } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { fetchJsonWithRetry, fetchWithRetry } from "@/lib/http/retry";

interface LibraryDocument {
  id: string;
  name: string;
  mimeType: string;
  type: string;
  sizeBytes: number;
  publicUrl?: string | null;
  createdAt: string;
  chunkCount: number;
}

interface MemoryTimelineEvent {
  id: string;
  type: "document" | "incident" | "evidence" | "vendor" | "compliance" | "decision" | "approval" | "report" | "legal";
  title: string;
  detail: string;
  createdAt: string;
}

interface MemoryResponse {
  vendor: {
    name: string | null;
    incidents: number;
    complianceReviews: number;
    legalEscalations: number;
  };
  totals: {
    documents: number;
    incidents: number;
    evidence: number;
    approvals: number;
    reports: number;
  };
  timeline: MemoryTimelineEvent[];
}

function formatBytes(size: number): string {
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)} MB`;
  if (size >= 1_000) return `${(size / 1_000).toFixed(1)} KB`;
  return `${size} B`;
}

function timelineBadge(type: MemoryTimelineEvent["type"]): "cyan" | "violet" | "amber" | "emerald" | "red" | "default" {
  if (type === "incident") return "red";
  if (type === "compliance" || type === "legal") return "amber";
  if (type === "approval" || type === "decision") return "violet";
  if (type === "report") return "emerald";
  if (type === "vendor") return "amber";
  return "cyan";
}

export function EnterpriseKnowledgeView() {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [vendorQuery, setVendorQuery] = useState("");
  const [loadingMemory, setLoadingMemory] = useState(true);
  const [memory, setMemory] = useState<MemoryResponse | null>(null);
  const [agents, setAgents] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [toast, setToast] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
  const allowedFilePattern = /\.(pdf|docx|txt|md|html|json)$/i;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadDocuments = async () => {
    setLoadingDocs(true);
    setError(null);
    try {
      const data = await fetchJsonWithRetry<{ documents?: LibraryDocument[] }>("/api/documents", { cache: "no-store" }, { retries: 2 });
      setDocuments(data.documents ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadMemory = async (vendor?: string) => {
    setLoadingMemory(true);
    try {
      const params = new URLSearchParams();
      if (vendor?.trim()) params.set("vendor", vendor.trim());
      const data = await fetchJsonWithRetry<{ memory?: MemoryResponse }>(`/api/memory${params.toString() ? `?${params.toString()}` : ""}`, { cache: "no-store" }, { retries: 2 });
      setMemory(data.memory ?? null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load enterprise memory";
      setError(message);
      setToast({ kind: "error", message });
    } finally {
      setLoadingMemory(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
    void loadMemory();
    void fetchJsonWithRetry<{ agents?: Array<{ id: string; name: string; role: string }> }>("/api/agents")
      .then((data) => setAgents(data.agents ?? []))
      .catch(() => {});
    const timer = setInterval(() => {
      void loadMemory(vendorQuery);
    }, 30000);
    return () => clearInterval(timer);
  }, [vendorQuery]);

  const onChooseFile = () => fileRef.current?.click();

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!allowedFilePattern.test(file.name)) {
      setToast({ kind: "error", message: "Unsupported file. Allowed: PDF, DOCX, TXT, MD, HTML, JSON." });
      event.target.value = "";
      return;
    }
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      setToast({ kind: "error", message: "File size must be between 1 byte and 25 MB." });
      event.target.value = "";
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetchWithRetry("/api/documents/upload", {
        method: "POST",
        body: form,
      }, { retries: 1 });
      const data = (await res.json().catch(() => ({}))) as { documentId?: string; chunkCount?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setToast({ kind: "success", message: `Uploaded ${file.name} (${data.chunkCount ?? 0} chunks)` });
      await Promise.all([loadDocuments(), loadMemory(vendorQuery)]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      setError(message);
      setToast({ kind: "error", message });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const onSearchVendor = async () => {
    await loadMemory(vendorQuery);
    if (vendorQuery.trim()) {
      setToast({ kind: "info", message: `Memory loaded for ${vendorQuery.trim()}` });
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return doc.name.toLowerCase().includes(q) || doc.type.toLowerCase().includes(q);
  });

  return (
    <AppShell title="Enterprise Knowledge Engine" subtitle="Contracts · Policies · Audit Reports · Investigation Memory · Semantic Search">
      {toast && <Toast kind={toast.kind} message={toast.message} />}
      <div className="grid h-[calc(100vh-5.5rem)] grid-cols-12 gap-3 p-3">
        <div className="col-span-12 space-y-3 lg:col-span-4">
          <CyberPanel title="Knowledge Agents" glow="violet" hover={false}>
            {(agents.length ? agents : [{ id: "memory", name: "Memory Agent", role: "Enterprise investigation memory" }]).map((a) => (
              <div key={a.id} className="mb-2 flex items-start gap-2 rounded border border-violet-500/20 bg-violet-500/[0.03] p-2.5 last:mb-0">
                <Brain className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                <div>
                  <div className="font-mono text-[11px] font-medium text-white">{a.name}</div>
                  <div className="font-mono text-[10px] text-slate-500">{a.role}</div>
                </div>
              </div>
            ))}
          </CyberPanel>

          <CyberPanel title="Upload Documents" glow="cyan" hover={false}>
            <button
              type="button"
              onClick={onChooseFile}
              disabled={uploading}
              className="flex w-full flex-col items-center rounded border border-dashed border-cyan-500/25 bg-cyan-500/[0.03] p-6 text-left transition hover:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Upload className="mb-2 h-8 w-8 text-cyan-400/60" />
              <div className="font-mono text-[11px] text-slate-400">Contracts · Policies · Audit Reports</div>
              <div className="mt-1 font-mono text-[10px] text-slate-600">{uploading ? "Uploading..." : "Click to upload document"}</div>
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={onFileChange} />
            {error && <p className="mt-2 font-mono text-[11px] text-red-400">{error}</p>}
            {error && (
              <button
                type="button"
                onClick={() => void loadDocuments()}
                className="mt-2 rounded border border-red-500/30 bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-300"
              >
                Retry
              </button>
            )}
          </CyberPanel>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <CyberPanel title="Document Library" glow="cyan" className="h-full" hover={false}>
            <div className="mb-3 flex items-center gap-2 rounded border border-cyan-500/20 bg-black/20 px-3 py-2">
              <Search className="h-4 w-4 text-cyan-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full bg-transparent font-mono text-[11px] text-slate-400 outline-none placeholder:text-slate-600"
              />
            </div>
            <div className="max-h-[calc(100vh-16rem)] space-y-1.5 overflow-y-auto">
              {loadingDocs && <div className="font-mono text-[11px] text-slate-500">Loading documents...</div>}
              {!loadingDocs && !filteredDocs.length && <div className="font-mono text-[11px] text-slate-500">No documents found.</div>}
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded border border-white/5 px-3 py-2 hover:border-cyan-500/20">
                  <FileText className="h-4 w-4 shrink-0 text-cyan-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-[11px] font-medium text-white">{doc.name}</div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {doc.type.toUpperCase()} · {formatBytes(doc.sizeBytes)} · {new Date(doc.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <CyberBadge label={`${doc.chunkCount} chunks`} variant="cyan" />
                  </div>
                </div>
              ))}
            </div>
          </CyberPanel>
        </div>

        <div className="col-span-12 space-y-3 lg:col-span-3">
          <CyberPanel title="Enterprise Memory Timeline" glow="amber" hover={false}>
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-amber-400" />
              <span className="font-mono text-[11px] font-medium text-amber-300">Database-backed memory</span>
            </div>

            <div className="mb-3 flex gap-2">
              <input
                value={vendorQuery}
                onChange={(e) => setVendorQuery(e.target.value)}
                placeholder="Vendor name"
                className="w-full rounded border border-amber-500/20 bg-black/20 px-2 py-1.5 font-mono text-[11px] text-slate-300 outline-none"
              />
              <button
                type="button"
                onClick={onSearchVendor}
                className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 font-mono text-[10px] text-amber-200"
              >
                Load
              </button>
            </div>

            {loadingMemory && <div className="font-mono text-[11px] text-slate-500">Loading memory timeline...</div>}

            {memory && !loadingMemory && (
              <>
                <div className="mb-3 grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
                  <div className="rounded border border-red-500/20 p-1.5">
                    <div className="text-base font-bold text-red-400">{memory.vendor.incidents}</div>
                    <div className="text-slate-500">Incidents</div>
                  </div>
                  <div className="rounded border border-violet-500/20 p-1.5">
                    <div className="text-base font-bold text-violet-400">{memory.vendor.complianceReviews}</div>
                    <div className="text-slate-500">Compliance</div>
                  </div>
                  <div className="rounded border border-amber-500/20 p-1.5">
                    <div className="text-base font-bold text-amber-400">{memory.vendor.legalEscalations}</div>
                    <div className="text-slate-500">Legal</div>
                  </div>
                </div>

                <div className="mb-2 font-mono text-[10px] text-slate-500">
                  {memory.vendor.name
                    ? `${memory.vendor.name} appeared in ${memory.vendor.incidents} incidents, ${memory.vendor.complianceReviews} compliance reviews, ${memory.vendor.legalEscalations} legal escalations.`
                    : "Showing organization-wide memory timeline."}
                </div>

                <div className="max-h-[calc(100vh-24rem)] space-y-1.5 overflow-y-auto">
                  {memory.timeline.length === 0 && <div className="font-mono text-[10px] text-slate-500">No memory events found.</div>}
                  {memory.timeline.map((event) => (
                    <div key={event.id} className="rounded border border-amber-500/15 bg-amber-500/[0.03] p-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <CyberBadge label={event.type} variant={timelineBadge(event.type)} />
                        <span className="font-mono text-[9px] text-slate-600">{new Date(event.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="font-mono text-[10px] font-medium text-slate-200">{event.title}</div>
                      <div className="font-mono text-[10px] text-slate-500">{event.detail}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CyberPanel>
        </div>
      </div>
    </AppShell>
  );
}
