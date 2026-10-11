import { LogOut } from "lucide-react";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { getProfile, requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const profile = await getProfile();
  const name = profile?.full_name || user.email;

  return (
    <div className="bg-muted">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr] lg:gap-10 lg:px-8 lg:py-12">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="truncate font-medium text-primary">{name}</p>
          </div>
          <DashboardNav isAdmin={profile?.role === "admin"} />
          <form action={signOut} className="hidden lg:block">
            <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
              <LogOut aria-hidden="true" />
              Log out
            </Button>
          </form>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
