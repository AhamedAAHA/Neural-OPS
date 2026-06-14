import type { BandAdapter } from "./types";
import { MockBandAdapter, getMockBandAdapter } from "./mock-band-adapter";
import { RealBandAdapter } from "./real-band-adapter";
import { BandService } from "./band-service";

export function getBandAdapter(): BandAdapter {
  if (process.env.USE_MOCK_BAND === "true") {
    return getMockBandAdapter();
  }

  const hasCreds =
    Boolean(process.env.BAND_API_KEY) &&
    Boolean(process.env.BAND_WORKSPACE_ID) &&
    Boolean(process.env.BAND_AGENT_SECRET);

  if (!hasCreds) {
    console.warn("[Band] Missing credentials — falling back to in-memory adapter.");
    return getMockBandAdapter();
  }
  return new RealBandAdapter();
}

export * from "./types";
export { MockBandAdapter, RealBandAdapter, BandService };
