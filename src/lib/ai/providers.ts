import type { AIProvider, AICompleteInput, AICompleteOutput } from "./types";

async function openAICompatibleComplete(
  baseUrl: string,
  apiKey: string,
  model: string,
  providerName: string,
  input: AICompleteInput
): Promise<AICompleteOutput> {
  const start = Date.now();
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.prompt },
    ],
    temperature: input.temperature ?? 0.3,
  };

  if (input.responseFormat === "json") {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${providerName} API error: ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const latencyMs = Date.now() - start;

  return {
    text,
    raw: data,
    model,
    provider: providerName,
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
    latencyMs,
  };
}

export class AIMLProvider implements AIProvider {
  name = "AIML_API";

  async complete(input: AICompleteInput): Promise<AICompleteOutput> {
    const apiKey = process.env.AIML_API_KEY;
    if (!apiKey) throw new Error("AIML_API_KEY not configured");
    return openAICompatibleComplete(
      process.env.AIML_BASE_URL ?? "https://api.aimlapi.com/v1",
      apiKey,
      process.env.AIML_MODEL ?? "gpt-4o-mini",
      this.name,
      input
    );
  }
}

export class FeatherlessProvider implements AIProvider {
  name = "FEATHERLESS";

  async complete(input: AICompleteInput): Promise<AICompleteOutput> {
    const apiKey = process.env.FEATHERLESS_API_KEY;
    if (!apiKey) throw new Error("FEATHERLESS_API_KEY not configured");
    return openAICompatibleComplete(
      process.env.FEATHERLESS_BASE_URL ?? "https://api.featherless.ai/v1",
      apiKey,
      process.env.FEATHERLESS_MODEL ?? "meta-llama/Llama-3.3-70B-Instruct",
      this.name,
      input
    );
  }
}

export class OpenAIProvider implements AIProvider {
  name = "OPENAI";

  async complete(input: AICompleteInput): Promise<AICompleteOutput> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
    return openAICompatibleComplete(
      "https://api.openai.com/v1",
      apiKey,
      process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      this.name,
      input
    );
  }
}

export class LocalProvider implements AIProvider {
  name = "LOCAL";

  async complete(input: AICompleteInput): Promise<AICompleteOutput> {
    const combined = `${input.system}\n\n${input.prompt}`;
    return {
      text: `[LOCAL] Processed: ${combined.slice(0, 200)}...`,
      raw: { local: true },
      model: "local-deterministic",
      provider: this.name,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: 1,
    };
  }
}

const providers: Record<string, AIProvider> = {
  AIML_API: new AIMLProvider(),
  FEATHERLESS: new FeatherlessProvider(),
  OPENAI: new OpenAIProvider(),
  LOCAL: new LocalProvider(),
};

export function getAIProvider(name: string): AIProvider {
  return providers[name] ?? providers.LOCAL;
}

export function getAvailableProviders() {
  return [
    { name: "AIML_API", configured: !!process.env.AIML_API_KEY, model: process.env.AIML_MODEL ?? "gpt-4o-mini" },
    { name: "FEATHERLESS", configured: !!process.env.FEATHERLESS_API_KEY, model: process.env.FEATHERLESS_MODEL ?? "meta-llama/Llama-3.3-70B-Instruct" },
    { name: "OPENAI", configured: !!process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL ?? "gpt-4o-mini" },
    { name: "LOCAL", configured: true, model: "local-deterministic" },
  ];
}

export async function completeWithFallback(
  preferred: string,
  input: AICompleteInput
): Promise<AICompleteOutput> {
  const order = [preferred, "AIML_API", "FEATHERLESS", "OPENAI", "LOCAL"];
  const tried = new Set<string>();

  for (const name of order) {
    if (tried.has(name)) continue;
    tried.add(name);
    try {
      return await getAIProvider(name).complete(input);
    } catch {
      continue;
    }
  }
  return getAIProvider("LOCAL").complete(input);
}
