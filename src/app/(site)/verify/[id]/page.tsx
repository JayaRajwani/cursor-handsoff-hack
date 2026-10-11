import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheck, Download, XCircle } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Certificate ${id.toUpperCase()}`,
    description: `Verification of a ${siteConfig.name} certificate of completion.`,
    robots: { index: false, follow: false },
  };
}

type VerifiedCertificate = { verification_code: string; recipient_name: string; course_title: string; course_slug: string; issued_at: string };

export default async function VerifyCertificatePage({ params }: Props) {
  const { id } = await params;
  let cert: VerifiedCertificate | null = null;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    // Uses a database function that only returns the one certificate matching the code.
    const { data } = await supabase.rpc("verify_certificate", { p_code: id });
    cert = ((data as VerifiedCertificate[] | null) ?? [])[0] ?? null;
  }

  return (
    <>
      <PageHeader title="Certificate verification" breadcrumbs={[{ name: "Verify a certificate", href: "/verify" }, { name: id.toUpperCase(), href: `/verify/${id}` }]} />
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {cert ? (
          <div className="rounded-xl border-2 border-success/40 bg-card p-6 shadow-sm sm:p-8">
            <p className="flex items-center gap-2 text-lg font-semibold text-success">
              <BadgeCheck className="size-6" aria-hidden="true" />
              Valid certificate
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-[160px_1fr]">
              <dt className="text-sm text-muted-foreground">Awarded to</dt>
              <dd className="font-serif text-2xl font-semibold text-primary">{cert.recipient_name}</dd>
              <dt className="text-sm text-muted-foreground">Course</dt>
              <dd className="font-medium">
                <Link href={`/courses/${cert.course_slug}`} className="hover:underline">
                  {cert.course_title}
                </Link>
              </dd>
              <dt className="text-sm text-muted-foreground">Completed on</dt>
              <dd>{formatDate(cert.issued_at)}</dd>
              <dt className="text-sm text-muted-foreground">Certificate ID</dt>
              <dd className="font-mono">{cert.verification_code}</dd>
              <dt className="text-sm text-muted-foreground">Issued by</dt>
              <dd>{siteConfig.name}</dd>
            </dl>
            <Button asChild variant="outline" className="mt-6">
              <a href={`/api/certificates/${cert.verification_code}`}>
                <Download aria-hidden="true" />
                Download PDF
              </a>
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-destructive/30 bg-card p-6 shadow-sm sm:p-8">
            <p className="flex items-center gap-2 text-lg font-semibold text-destructive">
              <XCircle className="size-6" aria-hidden="true" />
              No certificate found
            </p>
            <p className="mt-3 text-muted-foreground">
              We could not find a certificate with the ID <span className="font-mono">{id.toUpperCase()}</span>. Please check the ID and try again, or{" "}
              <Link href="/contact" className="text-teal underline">
                contact us
              </Link>
              .
            </p>
            <Button asChild className="mt-6">
              <Link href="/verify">Try another ID</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
