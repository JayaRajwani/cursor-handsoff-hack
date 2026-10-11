/**
 * Supabase sends people here after they click a link in an email
 * (confirm sign-up, magic link, reset password). We swap the one-time
 * code for a login session, then send them on to `next`.
 */
import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth/callback]", error.message);
  }

  const description = searchParams.get("error_description");
  const url = new URL("/login", origin);
  url.searchParams.set("error", description ?? "Your link is invalid or has expired. Please try again.");
  return NextResponse.redirect(url);
}
