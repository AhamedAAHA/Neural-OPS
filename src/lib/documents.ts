import { createHash } from "crypto";

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "txt", "md", "html", "json"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/html",
  "application/json",
]);

function extFromName(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function inferDocumentType(name: string, mimeType: string): "pdf" | "docx" | "txt" | "md" | "html" | "json" | "other" {
  const ext = extFromName(name);
  if (mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === "docx") return "docx";
  if (mimeType === "text/plain" || ext === "txt") return "txt";
  if (mimeType === "text/markdown" || ext === "md") return "md";
  if (mimeType === "text/html" || ext === "html") return "html";
  if (mimeType === "application/json" || ext === "json") return "json";
  return "other";
}

export function validateDocumentFile(file: File): { valid: true } | { valid: false; error: string } {
  const ext = extFromName(file.name);
  const hasValidExt = ALLOWED_EXTENSIONS.has(ext);
  const hasValidMime = file.type ? ALLOWED_MIME_TYPES.has(file.type) : false;

  if (!hasValidExt && !hasValidMime) {
    return { valid: false, error: "Unsupported file type. Allowed: PDF, DOCX, TXT, MD, HTML, JSON." };
  }
  if (file.size <= 0) {
    return { valid: false, error: "Uploaded file is empty." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { valid: false, error: "File too large. Maximum upload size is 25 MB." };
  }
  return { valid: true };
}

export async function extractTextFromFile(file: File): Promise<{ text: string; method: string }> {
  const kind = inferDocumentType(file.name, file.type);

  if (kind === "txt" || kind === "md" || kind === "html" || kind === "json") {
    return { text: await file.text(), method: "native_text" };
  }

  if (kind === "pdf") {
    try {
      const pdfParseModule = await import("pdf-parse");
      const buffer = Buffer.from(await file.arrayBuffer());
      if (!buffer.length) return { text: "", method: "pdf_parse_empty" };
      const pdf = new pdfParseModule.PDFParse({ data: buffer });
      const parsed = await pdf.getText();
      await pdf.destroy();
      return { text: parsed.text?.trim() ?? "", method: "pdf_parse" };
    } catch {
      return { text: "", method: "pdf_parse_failed" };
    }
  }

  if (kind === "docx") {
    try {
      const mammoth = await import("mammoth");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value?.trim() ?? "", method: "docx_mammoth" };
    } catch {
      return { text: "", method: "docx_parse_failed" };
    }
  }

  try {
    return { text: await file.text(), method: "best_effort_text" };
  } catch {
    return { text: "", method: "unreadable_binary" };
  }
}

export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + CHUNK_SIZE);
    chunks.push(normalized.slice(start, end));
    if (end >= normalized.length) break;
    start = Math.max(0, end - CHUNK_OVERLAP);
  }
  return chunks;
}

export function approximateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

export function placeholderEmbedding(text: string): number[] {
  const hash = createHash("sha256").update(text).digest();
  const dims = 32;
  const out: number[] = [];
  for (let i = 0; i < dims; i += 1) {
    out.push((hash[i] / 255) * 2 - 1);
  }
  return out;
}
