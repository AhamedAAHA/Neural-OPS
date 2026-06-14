import { createClient } from "@supabase/supabase-js";
import { isSupabaseRealtimeEnabled, normalizeSupabaseProjectUrl } from "./config";

let browserClient: ReturnType<typeof createClient> | null = null;
let browserClientSignature: string | null = null;

export function createSupabaseAdmin() {
  const url = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
}

export function createSupabaseBrowser() {
  const url = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
