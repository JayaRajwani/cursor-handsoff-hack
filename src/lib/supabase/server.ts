/**
 * Supabase client for the SERVER (Server Components, Server Actions, Route Handlers).
 * It reads the logged-in user's session from cookies, so every query runs
 * as that user and Row Level Security applies.
 */
import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { supabasePublicKey, supabaseUrl } from "./env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: the proxy (src/proxy.ts) refreshes sessions.
        }
      },
    },
  });
}
