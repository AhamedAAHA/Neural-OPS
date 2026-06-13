import type { ModelProvider } from "@prisma/client";

export interface AICompleteInput {
  system: string;
  prompt: string;
  temperature?: number;
  responseFormat?: "text" | "json";
}

export interface AICompleteOutput {
  text: string;
  raw: unknown;
  model: string;
  provider: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
}

export interface AIProvider {
  name: string;
  complete(input: AICompleteInput): Promise<AICompleteOutput>;
}

export type ProviderName = "AIML_API" | "FEATHERLESS" | "OPENAI" | "LOCAL";

export const PROVIDER_MAP: Record<ProviderName, ModelProvider> = {
  AIML_API: "AIML_API",
  FEATHERLESS: "FEATHERLESS",
  OPENAI: "OPENAI",
  LOCAL: "LOCAL",
};
