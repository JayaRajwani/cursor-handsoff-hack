import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("newsletter_subscribers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(500);
  const subscribers = (data ?? []) as { id: string; email: string; source: string | null; created_at: string }[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Newsletter subscribers ({count ?? 0})</h1>
        <Button asChild variant="outline" size="sm">
          <a href="/api/admin/subscribers">
            <Download aria-hidden="true" />
            Export CSV
          </a>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Export the list to import into your email newsletter tool (for example Resend Audiences, Mailchimp or Brevo).</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Signed up from</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscribers.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.email}</TableCell>
              <TableCell>{s.source ?? "—"}</TableCell>
              <TableCell>{formatDate(s.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
