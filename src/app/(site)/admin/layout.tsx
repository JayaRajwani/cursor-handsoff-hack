import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth";
import { createMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export const metadata = createMetadata({ title: "Admin", description: "Administration", path: "/admin", noIndex: true });

/** Every page under /admin is only available to users with role "admin". */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const supabase = await createClient();
  const { count } = await supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending");

  return (
    <div className="bg-muted">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[230px_1fr] lg:gap-10 lg:px-8 lg:py-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 hidden text-xs font-semibold tracking-wide text-muted-foreground uppercase lg:block">Admin panel</p>
          <AdminNav pendingCount={count ?? 0} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
