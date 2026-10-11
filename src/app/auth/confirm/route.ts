/**
 * Alternative email-link handler using `token_hash` (works even if the link
 * is opened in a different browser). To use it, edit the Supabase email
 * templates (see README → "Email templates").
 */
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { safeNextPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"), type === "recovery" ? "/reset-password" : "/dashboard");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth/confirm]", error.message);
  }

  const url = new URL("/login", origin);
  url.searchParams.set("error", "Your link is invalid or has expired. Please try again.");
  return NextResponse.redirect(url);
}
