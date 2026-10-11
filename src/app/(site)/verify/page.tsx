import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Verify a certificate",
  description: "Check that a MedAI Academy certificate of completion is genuine by entering its certificate ID.",
  path: "/verify",
});

async function lookup(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 30);
  redirect(code ? `/verify/${code}` : "/verify");
}

export default function VerifyPage() {
  return (
    <>
      <PageHeader
        title="Verify a certificate"
        description="Employers and institutions can confirm that a certificate is genuine."
        breadcrumbs={[{ name: "Verify a certificate", href: "/verify" }]}
      />
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <form action={lookup} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <ShieldCheck className="size-8 text-teal" aria-hidden="true" />
          <div className="space-y-1.5">
            <Label htmlFor="code">Certificate ID</Label>
            <Input id="code" name="code" placeholder="MAI-XXXX-XXXX-XXXX" required autoComplete="off" className="font-mono uppercase" />
            <p className="text-xs text-muted-foreground">The ID is printed at the bottom of every certificate.</p>
          </div>
          <Button type="submit" size="lg">
            Verify
          </Button>
        </form>
      </div>
    </>
  );
}
