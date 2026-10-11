/**
 * Next.js Proxy (formerly "middleware") — runs before matching requests.
 * We use it to refresh the Supabase login session and protect private pages.
 */
import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only run on pages that need the session. Public marketing pages,
  // static files and images skip the proxy, which keeps them fast.
  matcher: ["/dashboard/:path*", "/admin/:path*", "/enroll/:path*", "/learn/:path*", "/auth/:path*", "/login", "/signup"],
};
