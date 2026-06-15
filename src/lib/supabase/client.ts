import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isSupabaseRealtimeEnabled,
  normalizeSupabaseProjectUrl,
  resolveSupabaseAdminKey,
  resolveSupabasePublishableKey,
} from "./config";

let browserClient: ReturnType<typeof createClient> | null = null;
let browserClientSignature: string | null = null;

function isJwtKey(key: string) {
  return key.startsWith("eyJ") && key.split(".").length === 3;
}

function createAdminFetch(secretKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers ?? {});
    headers.set("apikey", secretKey);
    headers.delete("authorization");
    return fetch(input, { ...init, headers });
  };
}

export function createSupabaseAdmin(): SupabaseClient | null {
  const url = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const adminKey = resolveSupabaseAdminKey();
  if (!url || !adminKey) return null;

  if (isJwtKey(adminKey)) {
    return createClient(url, adminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }

  const publishableKey = resolveSupabasePublishableKey();
  if (!publishableKey) return null;

  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: createAdminFetch(adminKey),
    },
    realtime: { params: { eventsPerSecond: 10 } },
  });
}

export function createSupabaseBrowser() {
  const url = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = resolveSupabasePublishableKey();
  if (!url || !key) return null;
  const signature = `${url}:${key.slice(0, 10)}`;
  if (browserClient && browserClientSignature === signature) return browserClient;

  browserClient = createClient(url, key, {
    realtime: isSupabaseRealtimeEnabled(url)
      ? { params: { eventsPerSecond: 10 } }
      : undefined,
  });
  browserClientSignature = signature;
  return browserClient;
}
