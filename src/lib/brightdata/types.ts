export interface BrightDataSignal {
  id: string;
  source: string;
  agent: string;
  signal: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface VendorIntelligence {
  vendor: string;
  reputationScore: number;
  ownership: string;
  complaints: number;
  sanctions: boolean;
  regulatoryActions: number;
  fraudIndicators: string[];
}

export interface BrightDataAdapter {
  queryVendorIntelligence(vendor: string): Promise<VendorIntelligence>;
  fetchSignals(incidentId?: string): Promise<BrightDataSignal[]>;
  searchDarkWeb(query: string): Promise<BrightDataSignal[]>;
}
