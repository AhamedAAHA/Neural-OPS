import type { BandAdapter } from "./types";
import { MockBandAdapter, getMockBandAdapter } from "./mock-band-adapter";
import { RealBandAdapter } from "./real-band-adapter";

export function getBandAdapter(): BandAdapter {
  if (process.env.USE_MOCK_BAND === "true" || !process.env.BAND_API_KEY) {
    return getMockBandAdapter();
  }
  return new RealBandAdapter();
}

export * from "./types";
export { MockBandAdapter, RealBandAdapter };
