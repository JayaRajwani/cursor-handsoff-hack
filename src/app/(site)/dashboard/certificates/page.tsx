import Link from "next/link";
import { Award, Download, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/learning";
import { createMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const metadata = createMetadata({ title: "My certificates", description: "Download your certificates.", path: "/dashboard/certificates", noIndex: true });

export default async function CertificatesPage() {
  const user = await requireUser("/dashboard/certificates");
  const { certificates, courses } = await getDashboardData(user.id);
  const inProgress = courses.filter((c) => c.enrollment.status === "active" && !c.certificate);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">My certificates</h1>
      {certificates.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <Award className="mx-auto size-8 text-teal" aria-hidden="true" />
          <p className="mt-3 font-medium text-primary">No certificates yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Complete every lesson in a course to receive your certificate automatically.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <li key={cert.id} className="rounded-xl border bg-card p-6 shadow-sm">
              <Award className="size-8 text-teal" aria-hidden="true" />
              <h2 className="mt-3 text-xl font-semibold">{cert.course_title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Issued {formatDate(cert.issued_at)}</p>
              <p className="mt-1 font-mono text-sm">ID: {cert.verification_code}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <a href={`/api/certificates/${cert.verification_code}`}>
                    <Download aria-hidden="true" />
                    Download PDF
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/verify/${cert.verification_code}`}>
                    <ExternalLink aria-hidden="true" />
                    Verification page
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {inProgress.length > 0 ? (
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">In progress</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {inProgress.map((c) => (
              <li key={c.course.slug}>
                {c.course.title} — {c.percent}% complete
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
