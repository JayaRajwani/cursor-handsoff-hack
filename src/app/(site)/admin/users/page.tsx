import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
  const term = q.trim().replace(/[%,()]/g, "");
  if (term) query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
  const [{ data }, { data: enrollmentRows }] = await Promise.all([query, supabase.from("enrollments").select("user_id").eq("status", "active")]);
  const users = (data ?? []) as Profile[];
  const counts = new Map<string, number>();
  for (const row of (enrollmentRows ?? []) as { user_id: string }[]) counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold">Users ({users.length})</h1>
        <form role="search" className="flex gap-2">
          <label htmlFor="user-search" className="sr-only">
            Search users
          </label>
          <input
            id="user-search"
            name="q"
            defaultValue={q}
            placeholder="Search name or email"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
          <button type="submit" className="h-9 rounded-md bg-primary px-3 text-sm text-white">
            Search
          </button>
        </form>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Profession</TableHead>
            <TableHead>Organisation</TableHead>
            <TableHead>Courses</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">
                {u.full_name || "—"} {u.role === "admin" ? <Badge variant="secondary">admin</Badge> : null}
              </TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.profession ?? "—"}</TableCell>
              <TableCell>{u.organization ?? "—"}</TableCell>
              <TableCell>{counts.get(u.id) ?? 0}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(u.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
