/**
 * Supabase client for the BROWSER (Client Components).
 * Uses the public key, so Row Level Security protects all data.
 */
import { createBrowserClient } from "@supabase/ssr";

import { supabasePublicKey, supabaseUrl } from "./env";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublicKey);
}
