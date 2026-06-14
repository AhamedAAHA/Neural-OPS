import type { BrightDataAdapter, BrightDataSignal, VendorIntelligence } from "./types";

const MOCK_SIGNALS: BrightDataSignal[] = [
  { id: "i1", source: "Bright Data", agent: "Vendor Intelligence", signal: "Primary vendor linked to prior fraud complaints (2024, 2025)", severity: "high", timestamp: "09:12" },
  { id: "i2", source: "Bright Data", agent: "Dark Web Intelligence", signal: "Finance Manager credentials found in leak database", severity: "critical", timestamp: "09:18" },
  { id: "i3", source: "Bright Data", agent: "Reputation Intelligence", signal: "Negative news spike: vendor payment scandal mentions +340%", severity: "medium", timestamp: "09:24" },
  { id: "i4", source: "Bright Data", agent: "Third Party Risk", signal: "Vendor dependency: 14 downstream systems affected", severity: "high", timestamp: "09:31" },
  { id: "i5", source: "Bright Data", agent: "Market Intelligence", signal: "Industry fraud trend: procurement scams up 22% QoQ", severity: "low", timestamp: "09:35" },
];

export class MockBrightDataAdapter implements BrightDataAdapter {
  async queryVendorIntelligence(vendor: string): Promise<VendorIntelligence> {
    return {
      vendor,
      reputationScore: 34,
      ownership: "Offshore Holdings Ltd (BVI)",
      complaints: 2,
      sanctions: false,
      regulatoryActions: 1,
      fraudIndicators: ["Prior duplicate invoice", "Bank account change request", "Shell company linkage"],
    };
  }

  async fetchSignals(incidentId?: string): Promise<BrightDataSignal[]> {
    void incidentId;
    return MOCK_SIGNALS;
  }

  async searchDarkWeb(query: string): Promise<BrightDataSignal[]> {
    void query;
    return [
      {
        id: "dw1",
        source: "Bright Data",
        agent: "Dark Web Intelligence Agent",
        signal: "Finance Manager credentials exposed in breach dump #8847",
        severity: "critical",
        timestamp: new Date().toISOString(),
      },
    ];
  }
}

let instance: MockBrightDataAdapter | null = null;

export function getBrightDataAdapter(): MockBrightDataAdapter {
  if (!instance) instance = new MockBrightDataAdapter();
  return instance;
}
