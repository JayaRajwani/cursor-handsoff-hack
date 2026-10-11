/**
 * Supabase ADMIN client — bypasses Row Level Security.
 *
 * ⚠️ Only use on the server, and only after you have checked who the user is.
 * It is used for: saving public form submissions (contact, newsletter,
 * institutions), issuing certificates, and the public certificate check.
 * The secret key must NEVER be exposed to the browser (no NEXT_PUBLIC_ prefix).
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";

import { supabaseUrl } from "./env";

const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isAdminClientConfigured = Boolean(supabaseUrl && secretKey);

export function createAdminClient() {
  if (!isAdminClientConfigured) {
    throw new Error(
      "Supabase admin client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
