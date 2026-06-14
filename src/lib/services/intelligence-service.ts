import { getBrightData } from "@/lib/brightdata";
import { prisma } from "@/lib/db";

export async function fetchIntelligenceSignals(incidentId?: string) {
  const bd = getBrightData();
  return bd.fetchSignals(incidentId);
}

export async function queryVendorIntelligence(vendor: string) {
  const bd = getBrightData();
  return bd.queryVendorIntelligence(vendor);
}

export async function searchDarkWeb(query: string) {
  const bd = getBrightData();
  return bd.searchDarkWeb(query);
}

export async function listKnowledgeDocuments() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, name: true, mimeType: true, type: true, sizeBytes: true, publicUrl: true, createdAt: true },
  });
  return documents.map((doc) => ({
    id: doc.id,
    name: doc.name,
    type: doc.type,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    publicUrl: doc.publicUrl,
    createdAt: doc.createdAt.toISOString(),
    tags: [doc.type],
  }));
}

export async function searchKnowledge(query: string) {
  const q = query.trim();
  if (!q) return listKnowledgeDocuments();
  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { textContent: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, name: true, mimeType: true, type: true, sizeBytes: true, publicUrl: true, createdAt: true },
  });
  return documents.map((doc) => ({
    id: doc.id,
    name: doc.name,
    type: doc.type,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    publicUrl: doc.publicUrl,
    createdAt: doc.createdAt.toISOString(),
    tags: [doc.type],
  }));
}

export async function getVendorMemory(vendor: string) {
  const vendorRecord = await prisma.vendor.findFirst({
    where: { name: vendor },
    include: { intelligence: { orderBy: { createdAt: "desc" }, take: 10 } },
  });

  if (!vendorRecord) {
    return { vendor, incidents: 0, audits: 0, legalEscalations: 0, summary: "No prior history.", history: [] };
  }

  const incidents = new Set(vendorRecord.intelligence.map((item) => item.incidentId).filter(Boolean)).size;
  return {
    vendor: vendorRecord.name,
    incidents,
    audits: vendorRecord.intelligence.length,
    legalEscalations: 0,
    summary: `${vendorRecord.name} has ${vendorRecord.intelligence.length} intelligence records in Neural OPS.`,
    history: vendorRecord.intelligence.map((item) => ({
      date: item.createdAt.toISOString().slice(0, 10),
      event: item.summary ?? "Vendor intelligence record created",
    })),
  };
}
