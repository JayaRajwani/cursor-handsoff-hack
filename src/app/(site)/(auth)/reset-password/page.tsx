import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/password-forms";
import { requireUser } from "@/lib/auth";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Choose a new password",
  description: "Set a new password for your account.",
  path: "/reset-password",
  noIndex: true,
});

export default async function ResetPasswordPage() {
  // The reset link logs the user in temporarily, so they must be logged in here.
  await requireUser("/reset-password");
  return (
    <AuthCard title="Choose a new password">
      <ResetPasswordForm />
    </AuthCard>
  );
}
