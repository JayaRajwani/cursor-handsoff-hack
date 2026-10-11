import { SubmitButton } from "@/components/forms/form-fields";
import { Badge } from "@/components/ui/badge";
import { toggleHandled } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Enquiry = {
  id: string;
  organization: string;
  contact_name: string;
  email: string;
  phone: string | null;
  role: string | null;
  staff_count: string | null;
  message: string;
  handled: boolean;
  created_at: string;
};

export default async function AdminEnquiriesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("institution_enquiries").select("*").order("created_at", { ascending: false }).limit(200);
  const enquiries = (data ?? []) as Enquiry[];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Institution enquiries</h1>
      {enquiries.length === 0 ? <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No enquiries yet.</p> : null}
      <ul className="space-y-4">
        {enquiries.map((e) => (
          <li key={e.id} className={`rounded-xl border bg-card p-5 shadow-sm ${e.handled ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-primary">{e.organization}</p>
                <p className="text-sm text-muted-foreground">
                  {e.contact_name}
                  {e.role ? ` (${e.role})` : ""} ·{" "}
                  <a href={`mailto:${e.email}`} className="text-teal underline">
                    {e.email}
                  </a>
                  {e.phone ? ` · ${e.phone}` : ""} · {formatDate(e.created_at)}
                </p>
                {e.staff_count ? <p className="mt-1 text-sm">Staff to train: {e.staff_count}</p> : null}
              </div>
              <Badge variant={e.handled ? "success" : "warning"}>{e.handled ? "Handled" : "New"}</Badge>
            </div>
            <p className="mt-3 text-sm whitespace-pre-wrap">{e.message}</p>
            <form action={toggleHandled} className="mt-3">
              <input type="hidden" name="table" value="institution_enquiries" />
              <input type="hidden" name="id" value={e.id} />
              <input type="hidden" name="handled" value={String(!e.handled)} />
              <SubmitButton variant="outline" size="sm" pendingText="…">
                {e.handled ? "Mark as new" : "Mark as handled"}
              </SubmitButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
