import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForms } from "@/components/auth/login-forms";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getUser, safeNextPath } from "@/lib/auth";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Log in",
  description: "Log in to your MedAI Academy account to continue learning.",
  path: "/login",
});

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNextPath(rawNext);
  if (await getUser()) redirect(next);

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to continue your courses."
      footer={
        <>
          New here?{" "}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-teal hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      {error ? (
        <Alert variant="destructive" className="mb-4" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <LoginForms next={next} />
    </AuthCard>
  );
}
