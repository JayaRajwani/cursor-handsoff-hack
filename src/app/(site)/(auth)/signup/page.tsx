import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";
import { getUser, safeNextPath } from "@/lib/auth";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Create your account",
  description: "Create a free MedAI Academy account to preview lessons, enrol in courses and track your progress.",
  path: "/signup",
});

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNextPath((await searchParams).next);
  if (await getUser()) redirect(next);

  return (
    <AuthCard
      title="Create your account"
      description="Free to create. Preview lessons, enrol in courses and track your progress."
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-teal hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm next={next} />
    </AuthCard>
  );
}
