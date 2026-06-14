import { createHash } from "crypto";
import { recordMonitoringEvent } from "@/lib/observability/store";

export interface BrightDataSource {
  id: string;
  agent: "Vendor Intelligence Agent" | "Reputation Intelligence Agent" | "Market Intelligence Agent" | "Third Party Risk Agent";
  category: "company_profile" | "news" | "complaints" | "reviews" | "regulatory_mentions" | "legal_disputes";
  title: string;
  url: string;
  snippet: string;
}

export interface VendorIntelligenceFinding {
  vendorName: string;
  companyProfile: BrightDataSource[];
  news: BrightDataSource[];
  complaints: BrightDataSource[];
  reviews: BrightDataSource[];
  regulatoryMentions: BrightDataSource[];
  legalDisputes: BrightDataSource[];
  sources: BrightDataSource[];
  scores: {
    vendorRiskScore: number;
    reputationScore: number;
    exposureScore: number;
  };
  summary: string;
  fetchedAt: string;
}

type SerpLikeSource = { title?: string; link?: string; url?: string; description?: string; snippet?: string };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isConfigured() {
  return Boolean(
    process.env.BRIGHT_DATA_API_KEY &&
      process.env.BRIGHT_DATA_SERP_ZONE &&
      process.env.BRIGHT_DATA_WEB_UNLOCKER_ZONE
  );
}

function sourceId(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function normalizeSources(
  rows: SerpLikeSource[],
  agent: BrightDataSource["agent"],
  category: BrightDataSource["category"]
): BrightDataSource[] {
  return rows
    .map((row) => {
      const title = (row.title ?? "").trim();
      const url = (row.link ?? row.url ?? "").trim();
      const snippet = (row.description ?? row.snippet ?? "").trim();
      if (!title || !url) return null;

      return {
        id: sourceId(`${agent}:${category}:${url}:${title}`),
        agent,
        category,
        title,
        url,
        snippet,
      } satisfies BrightDataSource;
    })
    .filter((row): row is BrightDataSource => Boolean(row));
}

function extractSearchRows(payload: unknown): SerpLikeSource[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;

  const candidates = [
    record.organic,
    record.results,
    record.items,
    (record.data as Record<string, unknown> | undefined)?.organic,
    (record.data as Record<string, unknown> | undefined)?.results,
    (record.data as Record<string, unknown> | undefined)?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as SerpLikeSource[];
    }
  }

  return [];
}

async function runSerpQuery(query: string) {
  const started = Date.now();
  const apiKey = process.env.BRIGHT_DATA_API_KEY as string;
  const serpZone = process.env.BRIGHT_DATA_SERP_ZONE as string;
  const baseUrl = process.env.BRIGHT_DATA_BASE_URL ?? "https://api.brightdata.com";

  const requestPayload = {
    zone: serpZone,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    format: "json",
    method: "GET",
    data_format: "markdown",
  };

  let response = await fetch(`${baseUrl}/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestPayload),
    cache: "no-store",
  });

  // Fallback for legacy SERP endpoint shape used in older Bright Data setups.
  if (response.status === 404) {
    response = await fetch(`${baseUrl}/serp/req`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ zone: serpZone, keyword: query, format: "json" }),
      cache: "no-store",
    });
  }

  if (!response.ok) {
    const body = await response.text();
    void recordMonitoringEvent({
      source: "BRIGHT_DATA",
      level: "error",
      operation: "brightdata.serp.query",
      status: "error",
      durationMs: Date.now() - started,
      message: `HTTP ${response.status}`,
      details: { query, bodyPreview: body.slice(0, 180) },
    }).catch(() => {});
    throw new Error(`Bright Data SERP failed (${response.status}): ${body.slice(0, 280)}`);
  }

  const payload = await response.json();
  void recordMonitoringEvent({
    source: "BRIGHT_DATA",
    operation: "brightdata.serp.query",
    durationMs: Date.now() - started,
    details: { query, statusCode: response.status },
  }).catch(() => {});
  return payload;
}

function calculateScores(sources: BrightDataSource[]) {
  const text = sources.map((source) => `${source.title} ${source.snippet}`.toLowerCase()).join(" \n");

  const riskSignals = ["fraud", "sanction", "laundering", "bribery", "lawsuit", "investigation", "violation", "penalty"];
  const reputationSignals = ["complaint", "scam", "negative", "boycott", "bad review", "exposed", "breach"];
  const exposureSignals = ["regulator", "sec", "fca", "compliance", "legal dispute", "class action", "subpoena", "litigation"];

  const riskHits = riskSignals.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
  const reputationHits = reputationSignals.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
  const exposureHits = exposureSignals.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);

  const vendorRiskScore = clamp(25 + riskHits * 9 + exposureHits * 4, 1, 100);
  const reputationScore = clamp(90 - reputationHits * 12 - riskHits * 3, 1, 100);
  const exposureScore = clamp(20 + exposureHits * 11 + riskHits * 2, 1, 100);

  return { vendorRiskScore, reputationScore, exposureScore };
}

export class BrightDataIntelligenceEngine {
  static configured() {
    return isConfigured();
  }

  async investigateVendor(vendorName: string, country?: string, industry?: string): Promise<VendorIntelligenceFinding> {
    const started = Date.now();
    if (!isConfigured()) {
      void recordMonitoringEvent({
        source: "BRIGHT_DATA",
        level: "error",
        operation: "brightdata.investigateVendor",
        status: "error",
        message: "Bright Data missing configuration",
        details: { vendorName },
      }).catch(() => {});
      throw new Error(
        "Bright Data is not configured. Set BRIGHT_DATA_API_KEY, BRIGHT_DATA_SERP_ZONE, and BRIGHT_DATA_WEB_UNLOCKER_ZONE."
      );
    }

    const context = [vendorName, country, industry].filter(Boolean).join(" ").trim();

    const [companyProfileRaw, newsRaw, complaintsRaw, reviewsRaw, regulatoryRaw, legalRaw] = await Promise.all([
      runSerpQuery(`${context} company profile ownership headquarters`),
      runSerpQuery(`${context} latest news`),
      runSerpQuery(`${context} complaints customer issues`),
      runSerpQuery(`${context} reviews ratings`),
      runSerpQuery(`${context} regulatory action compliance notice`),
      runSerpQuery(`${context} legal dispute lawsuit court case`),
    ]);

    const companyProfile = normalizeSources(
      extractSearchRows(companyProfileRaw),
      "Vendor Intelligence Agent",
      "company_profile"
    );
    const news = normalizeSources(extractSearchRows(newsRaw), "Reputation Intelligence Agent", "news");
    const complaints = normalizeSources(
      extractSearchRows(complaintsRaw),
      "Reputation Intelligence Agent",
      "complaints"
    );
    const reviews = normalizeSources(extractSearchRows(reviewsRaw), "Market Intelligence Agent", "reviews");
    const regulatoryMentions = normalizeSources(
      extractSearchRows(regulatoryRaw),
      "Third Party Risk Agent",
      "regulatory_mentions"
    );
    const legalDisputes = normalizeSources(
      extractSearchRows(legalRaw),
      "Third Party Risk Agent",
      "legal_disputes"
    );

    const sources = [
      ...companyProfile,
      ...news,
      ...complaints,
      ...reviews,
      ...regulatoryMentions,
      ...legalDisputes,
    ];

    const scores = calculateScores(sources);

    const result = {
      vendorName,
      companyProfile,
      news,
      complaints,
      reviews,
      regulatoryMentions,
      legalDisputes,
      sources,
      scores,
      summary: `${vendorName}: risk ${scores.vendorRiskScore}/100, reputation ${scores.reputationScore}/100, exposure ${scores.exposureScore}/100 based on ${sources.length} sources.`,
      fetchedAt: new Date().toISOString(),
    };
    void recordMonitoringEvent({
      source: "BRIGHT_DATA",
      operation: "brightdata.investigateVendor",
      durationMs: Date.now() - started,
      details: {
        vendorName,
        sources: sources.length,
        scores,
      },
    }).catch(() => {});
    return result;
  }
}
