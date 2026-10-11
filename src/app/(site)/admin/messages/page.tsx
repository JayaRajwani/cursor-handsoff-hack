import { SubmitButton } from "@/components/forms/form-fields";
import { Badge } from "@/components/ui/badge";
import { toggleHandled } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Message = { id: string; name: string; email: string; subject: string; message: string; handled: boolean; created_at: string };

export default async function AdminMessagesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
  const messages = (data ?? []) as Message[];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Contact messages</h1>
      {messages.length === 0 ? <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No messages yet.</p> : null}
      <ul className="space-y-4">
        {messages.map((m) => (
          <li key={m.id} className={`rounded-xl border bg-card p-5 shadow-sm ${m.handled ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-primary">{m.subject}</p>
                <p className="text-sm text-muted-foreground">
                  {m.name} ·{" "}
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="text-teal underline">
                    {m.email}
                  </a>{" "}
                  · {formatDate(m.created_at)}
                </p>
              </div>
              <Badge variant={m.handled ? "success" : "warning"}>{m.handled ? "Handled" : "New"}</Badge>
            </div>
            <p className="mt-3 text-sm whitespace-pre-wrap">{m.message}</p>
            <form action={toggleHandled} className="mt-3">
              <input type="hidden" name="table" value="contact_messages" />
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="handled" value={String(!m.handled)} />
              <SubmitButton variant="outline" size="sm" pendingText="…">
                {m.handled ? "Mark as new" : "Mark as handled"}
              </SubmitButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
