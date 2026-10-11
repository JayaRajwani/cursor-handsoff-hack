import Link from "next/link";

import { ProfileForm } from "@/components/dashboard/profile-form";
import { getProfile, requireUser } from "@/lib/auth";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Profile settings", description: "Update your profile.", path: "/dashboard/profile", noIndex: true });

export default async function ProfilePage() {
  const user = await requireUser("/dashboard/profile");
  const profile = await getProfile();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Profile settings</h1>
      <section className="max-w-2xl rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <ProfileForm
          defaults={{
            email: user.email ?? "",
            fullName: profile?.full_name ?? "",
            profession: profile?.profession ?? "",
            organization: profile?.organization ?? "",
          }}
        />
      </section>
      <section className="max-w-2xl rounded-xl border bg-card p-6 text-sm">
        <h2 className="text-lg font-semibold">Password</h2>
        <p className="mt-1 text-muted-foreground">
          To change your password,{" "}
          <Link href="/forgot-password" className="text-teal underline">
            request a reset link
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
