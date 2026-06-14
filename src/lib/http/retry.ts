export interface RetryOptions {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

export async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit, options?: RetryOptions): Promise<Response> {
  const retries = options?.retries ?? 2;
  const retryDelayMs = options?.retryDelayMs ?? 350;
  const timeoutMs = options?.timeoutMs ?? 15000;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (!isRetryableStatus(response.status) || attempt === retries) {
        return response;
      }
      await sleep(retryDelayMs * (attempt + 1));
      continue;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt === retries) throw error;
      await sleep(retryDelayMs * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed after retries");
}

export async function fetchJsonWithRetry<T>(input: RequestInfo | URL, init?: RequestInit, options?: RetryOptions): Promise<T> {
  const response = await fetchWithRetry(input, init, options);
  const data = (await response.json().catch(() => ({}))) as T & { error?: string; ok?: boolean; route?: string };
  if (!response.ok) {
    const route = data.route ? ` (${data.route})` : "";
    throw new Error(data.error ? `${data.error}${route}` : `Request failed with status ${response.status}`);
  }
  return data;
}
