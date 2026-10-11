/**
 * Reads Supabase settings from environment variables.
 *
 * Supabase offers two naming styles for its keys. Either works:
 *   - New:    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  and SUPABASE_SECRET_KEY
 *   - Legacy: NEXT_PUBLIC_SUPABASE_ANON_KEY         and SUPABASE_SERVICE_ROLE_KEY
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when the public Supabase settings are present. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublicKey);
