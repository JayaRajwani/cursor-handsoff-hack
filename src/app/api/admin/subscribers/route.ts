/** CSV export of newsletter subscribers (admins only). */
import { NextResponse } from "next/server";

import { getAdminOrNull } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!(await getAdminOrNull())) return new NextResponse("Forbidden", { status: 403 });
  const supabase = await createClient();
  const { data } = await supabase.from("newsletter_subscribers").select("email, source, created_at").order("created_at");
  // Prefix risky first characters so spreadsheet apps never treat a value as a formula.
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = ["email,source,subscribed_at", ...(data ?? []).map((r) => [r.email, r.source, r.created_at].map(cell).join(","))].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-subscribers.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
