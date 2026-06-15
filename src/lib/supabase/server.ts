import { createClient } from "@supabase/supabase-js";
import {
  normalizeSupabaseProjectUrl,
  resolveSupabaseAdminKey,
  resolveSupabasePublishableKey,
} from "./config";

export function createSupabaseServer() {
  const url = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = resolveSupabasePublishableKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
}

export { createSupabaseAdmin as createSupabaseServiceServer } from "./client";
