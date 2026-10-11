import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/password-forms";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Forgot password",
  description: "Reset your MedAI Academy password.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email address and we'll send you a link to choose a new password."
      footer={
        <Link href="/login" className="font-medium text-teal hover:underline">
          Back to login
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
