"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Shows "Log in / Get started" for visitors and "My dashboard" for
 * logged-in users. It checks the session in the browser so that public
 * pages can still be pre-built as fast static HTML.
 */
export function AuthNav({ onNavigate, stacked = false }: { onNavigate?: () => void; stacked?: boolean }) {
  // null = still checking. If Supabase isn't set up yet, everyone is "logged out".
  const [loggedIn, setLoggedIn] = useState<boolean | null>(isSupabaseConfigured ? null : false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setLoggedIn(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(Boolean(session)));
    return () => listener.subscription.unsubscribe();
  }, []);

  const width = stacked ? "w-full" : undefined;

  if (loggedIn) {
    return (
      <Button asChild size="sm" className={width} onClick={onNavigate}>
        <Link href="/dashboard">
          <LayoutDashboard aria-hidden="true" />
          My dashboard
        </Link>
      </Button>
    );
  }

  // While loading, keep the space reserved to avoid layout shift.
  return (
    <div className={stacked ? "flex flex-col gap-2" : "flex items-center gap-2"} aria-busy={loggedIn === null}>
      <Button asChild variant="ghost" size="sm" className={width} onClick={onNavigate}>
        <Link href="/login">Log in</Link>
      </Button>
      <Button asChild variant="teal" size="sm" className={width} onClick={onNavigate}>
        <Link href="/signup">Get started</Link>
      </Button>
    </div>
  );
}
