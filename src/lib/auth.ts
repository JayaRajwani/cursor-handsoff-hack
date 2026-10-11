/**
 * Data Access Layer for authentication.
 * Always use these helpers on the server to find out who the user is —
 * they validate the session with Supabase, so they cannot be faked.
 */
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** The logged-in user, or null. Cached for the duration of one request. */
export const getUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** The logged-in user's profile row, or null. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? null;
});

/** Only allow internal paths in ?next= redirects (prevents open-redirect attacks). */
export function safeNextPath(next: unknown, fallback = "/dashboard"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** Use at the top of private pages: sends logged-out visitors to the login page. */
export async function requireUser(nextPath = "/dashboard"): Promise<User> {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Use at the top of admin pages and admin actions. */
export async function requireAdmin(): Promise<{ user: User; profile: Profile }> {
  const user = await requireUser("/admin");
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") redirect("/dashboard?error=not-admin");
  return { user, profile };
}

/** For Server Actions: returns the admin profile or null (no redirect). */
export async function getAdminOrNull(): Promise<Profile | null> {
  const profile = await getProfile();
  return profile?.role === "admin" ? profile : null;
}
