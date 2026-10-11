import { ExternalLink } from "lucide-react";

import { AdminNotice } from "@/components/admin/notice";
import { SubmitButton } from "@/components/forms/form-fields";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPkr, paymentConfig } from "@/config/payment";
import { manualEnroll, reviewPayment, revokeEnrollment } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getAllCourses, getCourse } from "@/lib/content/courses";
import { createClient } from "@/lib/supabase/server";
import type { Enrollment, Payment, Profile } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusVariant = { pending: "warning", active: "success", approved: "success", rejected: "destructive" } as const;

export default async function AdminEnrollmentsPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  await requireAdmin();
  const { notice, error } = await searchParams;
  const supabase = await createClient();

  const [{ data: pendingRows }, { data: recentPayments }, { data: enrollmentRows }] = await Promise.all([
    supabase.from("payments").select("*").eq("status", "pending").order("created_at", { ascending: true }),
    supabase.from("payments").select("*").neq("status", "pending").order("reviewed_at", { ascending: false }).limit(50),
    supabase.from("enrollments").select("*").order("created_at", { ascending: false }).limit(200),
  ]);
  const pending = (pendingRows ?? []) as Payment[];
  const reviewed = (recentPayments ?? []) as Payment[];
  const enrollments = (enrollmentRows ?? []) as Enrollment[];

  // Look up learner names/emails
  const userIds = [...new Set([...pending, ...reviewed, ...enrollments].map((r) => r.user_id))];
  const { data: profileRows } = userIds.length
    ? await supabase.from("profiles").select("id, email, full_name").in("id", userIds)
    : { data: [] as Pick<Profile, "id" | "email" | "full_name">[] };
  const profiles = new Map((profileRows ?? []).map((p) => [p.id, p]));

  // Private screenshots: create temporary (1 hour) links for admins
  const screenshotUrls = new Map<string, string>();
  await Promise.all(
    pending
      .filter((p) => p.screenshot_path)
      .map(async (p) => {
        const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(p.screenshot_path!, 3600);
        if (data?.signedUrl) screenshotUrls.set(p.id, data.signedUrl);
      }),
  );

  const methodLabel = (id: string) => paymentConfig.methods.find((m) => m.id === id)?.label ?? id;
  const courseTitle = (slug: string) => getCourse(slug)?.title ?? slug;
  const who = (id: string) => profiles.get(id);

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold">Enrolments &amp; payments</h1>
      <AdminNotice notice={notice} error={error} />

      {/* ---------- Pending payments ---------- */}
      <section aria-labelledby="pending-heading">
        <h2 id="pending-heading" className="text-2xl font-semibold">
          Pending payments ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-xl border bg-card p-6 text-sm text-muted-foreground">Nothing to review — all caught up.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {pending.map((p) => {
              const learner = who(p.user_id);
              const course = getCourse(p.course_slug);
              const amountMismatch = course && course.price.pkr !== p.amount_pkr;
              return (
                <li key={p.id} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                      <dt className="text-muted-foreground">Learner</dt>
                      <dd className="font-medium">
                        {learner?.full_name || "—"} <span className="font-normal text-muted-foreground">({learner?.email})</span>
                      </dd>
                      <dt className="text-muted-foreground">Course</dt>
                      <dd>{courseTitle(p.course_slug)}</dd>
                      <dt className="text-muted-foreground">Amount</dt>
                      <dd>
                        {formatPkr(p.amount_pkr)}
                        {amountMismatch ? <span className="ml-2 text-warning">(current price {formatPkr(course.price.pkr)})</span> : null}
                      </dd>
                      <dt className="text-muted-foreground">Method</dt>
                      <dd>{methodLabel(p.method)}</dd>
                      <dt className="text-muted-foreground">Transaction ID</dt>
                      <dd className="font-mono">{p.transaction_id}</dd>
                      <dt className="text-muted-foreground">Paid by</dt>
                      <dd>{p.payer_name ?? "—"}</dd>
                      <dt className="text-muted-foreground">Submitted</dt>
                      <dd>{formatDate(p.created_at)}</dd>
                    </dl>
                    <div>
                      {screenshotUrls.get(p.id) ? (
                        <a href={screenshotUrls.get(p.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-teal underline">
                          <ExternalLink className="size-4" aria-hidden="true" />
                          View receipt
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">No receipt file</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end">
                    <form action={reviewPayment}>
                      <input type="hidden" name="paymentId" value={p.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <SubmitButton variant="success" pendingText="Approving…">
                        Approve &amp; give access
                      </SubmitButton>
                    </form>
                    <form action={reviewPayment} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
                      <input type="hidden" name="paymentId" value={p.id} />
                      <input type="hidden" name="decision" value="reject" />
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`note-${p.id}`} className="text-xs">
                          Reason (sent to learner)
                        </Label>
                        <Input id={`note-${p.id}`} name="note" placeholder="e.g. Transaction ID not found" maxLength={500} />
                      </div>
                      <SubmitButton variant="outline" pendingText="Rejecting…">
                        Reject
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---------- Manual enrolment ---------- */}
      <section aria-labelledby="manual-heading" className="rounded-xl border bg-card p-6">
        <h2 id="manual-heading" className="text-xl font-semibold">
          Enrol a user manually
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">For institutional groups, scholarships or payments received another way. The user must have an account.</p>
        <form action={manualEnroll} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="space-y-1">
            <Label htmlFor="manual-email">User email</Label>
            <Input id="manual-email" name="email" type="email" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="manual-course">Course</Label>
            <NativeSelect id="manual-course" name="courseSlug" required defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              {getAllCourses().map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                  {c.published ? "" : " (unpublished)"}
                </option>
              ))}
            </NativeSelect>
          </div>
          <SubmitButton pendingText="Enrolling…">Enrol user</SubmitButton>
          <label className="flex items-center gap-2 text-sm md:col-span-3">
            <input type="checkbox" name="notify" defaultChecked className="accent-[var(--teal)]" />
            Send the confirmation email
          </label>
        </form>
      </section>

      {/* ---------- All enrolments ---------- */}
      <section aria-labelledby="all-heading">
        <h2 id="all-heading" className="text-2xl font-semibold">
          Enrolments (latest 200)
        </h2>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No enrolments yet.
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <span className="font-medium">{who(e.user_id)?.full_name || "—"}</span>
                      <br />
                      <span className="text-xs text-muted-foreground">{who(e.user_id)?.email}</span>
                    </TableCell>
                    <TableCell>{courseTitle(e.course_slug)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[e.status]}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{e.source}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(e.approved_at ?? e.created_at)}</TableCell>
                    <TableCell>
                      {e.status === "active" ? (
                        <form action={revokeEnrollment}>
                          <input type="hidden" name="enrollmentId" value={e.id} />
                          <SubmitButton variant="ghost" size="sm" pendingText="…">
                            Remove access
                          </SubmitButton>
                        </form>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ---------- Reviewed payments ---------- */}
      <section aria-labelledby="reviewed-heading">
        <h2 id="reviewed-heading" className="text-2xl font-semibold">
          Recently reviewed payments
        </h2>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reviewed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No reviewed payments yet.
                  </TableCell>
                </TableRow>
              ) : (
                reviewed.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{who(p.user_id)?.email}</TableCell>
                    <TableCell>{courseTitle(p.course_slug)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatPkr(p.amount_pkr)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.transaction_id}
                      <br />
                      <span className="font-sans text-muted-foreground">{methodLabel(p.method)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                      {p.admin_note ? <p className="mt-1 text-xs text-muted-foreground">{p.admin_note}</p> : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{p.reviewed_at ? formatDate(p.reviewed_at) : "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
