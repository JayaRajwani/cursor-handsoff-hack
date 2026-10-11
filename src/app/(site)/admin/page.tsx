import Link from "next/link";
import { BookOpenCheck, Clock, Users, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPkr } from "@/config/payment";
import { requireAdmin } from "@/lib/auth";
import { getAllCourses } from "@/lib/content/courses";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [users, activeEnrollments, pending, approved, messages, enquiries, perCourse] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("payments").select("amount_pkr").eq("status", "approved"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false),
    supabase.from("institution_enquiries").select("id", { count: "exact", head: true }).eq("handled", false),
    supabase.from("enrollments").select("course_slug").eq("status", "active"),
  ]);

  const revenue = ((approved.data ?? []) as { amount_pkr: number }[]).reduce((sum, p) => sum + p.amount_pkr, 0);
  const counts = new Map<string, number>();
  for (const row of (perCourse.data ?? []) as { course_slug: string }[]) counts.set(row.course_slug, (counts.get(row.course_slug) ?? 0) + 1);

  const stats = [
    { label: "Total users", value: String(users.count ?? 0), icon: Users, href: "/admin/users" },
    { label: "Active enrolments", value: String(activeEnrollments.count ?? 0), icon: BookOpenCheck, href: "/admin/enrollments" },
    { label: "Pending payments", value: String(pending.count ?? 0), icon: Clock, href: "/admin/enrollments", highlight: (pending.count ?? 0) > 0 },
    { label: "Revenue (approved)", value: formatPkr(revenue).replace("Free", "PKR 0"), icon: Wallet, href: "/admin/enrollments" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Admin overview</h1>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className={`block rounded-xl border bg-card p-5 shadow-sm hover:shadow-md ${s.highlight ? "border-warning/50" : ""}`}>
              <s.icon className={`size-5 ${s.highlight ? "text-warning" : "text-teal"}`} aria-hidden="true" />
              <p className="mt-3 font-serif text-3xl font-semibold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      {(pending.count ?? 0) > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning-soft p-5">
          <p className="font-medium text-warning">
            {pending.count} payment{pending.count === 1 ? "" : "s"} waiting for review.
          </p>
          <Button asChild size="sm">
            <Link href="/admin/enrollments">Review now</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Active learners by course</h2>
          <ul className="mt-4 divide-y text-sm">
            {getAllCourses().map((c) => (
              <li key={c.slug} className="flex justify-between gap-4 py-2">
                <span>
                  {c.title}
                  {!c.published ? <span className="text-muted-foreground"> (coming soon)</span> : null}
                </span>
                <span className="font-medium">{counts.get(c.slug) ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Inbox</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between">
              <Link href="/admin/messages" className="text-teal hover:underline">
                Unhandled contact messages
              </Link>
              <span className="font-medium">{messages.count ?? 0}</span>
            </li>
            <li className="flex justify-between">
              <Link href="/admin/enquiries" className="text-teal hover:underline">
                Unhandled institution enquiries
              </Link>
              <span className="font-medium">{enquiries.count ?? 0}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
