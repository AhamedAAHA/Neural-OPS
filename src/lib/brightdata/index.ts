import { MockBrightDataAdapter, getBrightDataAdapter } from "./mock-adapter";
import { BrightDataIntelligenceEngine } from "./intelligence-engine";
import type { BrightDataAdapter, BrightDataSignal, VendorIntelligence } from "./types";

class LiveBrightDataAdapter implements BrightDataAdapter {
  private engine = new BrightDataIntelligenceEngine();

  async queryVendorIntelligence(vendor: string): Promise<VendorIntelligence> {
    const finding = await this.engine.investigateVendor(vendor);
    return {
      vendor,
      reputationScore: finding.scores.reputationScore,
      ownership: finding.companyProfile[0]?.snippet ?? "Unknown ownership profile",
      complaints: finding.complaints.length,
      sanctions: finding.regulatoryMentions.some((item) => /sanction/i.test(item.snippet)),
      regulatoryActions: finding.regulatoryMentions.length,
      fraudIndicators: finding.legalDisputes.slice(0, 3).map((item) => item.title),
    };
  }

  async fetchSignals(incidentId?: string): Promise<BrightDataSignal[]> {
    void incidentId;
    return [];
  }

  async searchDarkWeb(query: string): Promise<BrightDataSignal[]> {
    const finding = await this.engine.investigateVendor(query);
    return finding.sources.slice(0, 5).map((source, index) => ({
      id: `bd-${index}`,
      source: "Bright Data",
      agent: source.agent,
      signal: source.snippet,
      severity: finding.scores.vendorRiskScore >= 75 ? "high" : finding.scores.vendorRiskScore >= 50 ? "medium" : "low",
      timestamp: finding.fetchedAt,
    }));
  }
}

export function getBrightData(): BrightDataAdapter {
  if (process.env.USE_MOCK_BRIGHT_DATA === "true") {
    return getBrightDataAdapter();
  }
  return new LiveBrightDataAdapter();
}

export { MockBrightDataAdapter, getBrightDataAdapter };
export type { BrightDataAdapter, BrightDataSignal, VendorIntelligence } from "./types";
