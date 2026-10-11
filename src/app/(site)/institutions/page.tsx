import Link from "next/link";
import { BarChart3, Building2, CalendarClock, FileCheck2, GraduationCap, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { StockPhoto } from "@/components/common/stock-photo";
import { InstitutionForm } from "@/components/forms/institution-form";
import { Button } from "@/components/ui/button";
import { stockPhotos } from "@/config/images";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "AI training for hospitals and clinics",
  description:
    "Train your doctors, nurses, pharmacists and administrative staff to use AI tools safely. Group enrolment, live workshops, governance support and progress reporting.",
  path: "/institutions",
});

const benefits = [
  { icon: GraduationCap, title: "Group enrolment", text: "Enrol whole departments with one invoice and group pricing." },
  { icon: CalendarClock, title: "Live workshops", text: "Online or on-site sessions tailored to your specialties." },
  { icon: ShieldCheck, title: "Safe-use policy support", text: "Help drafting AI use guidance aligned with your governance." },
  { icon: BarChart3, title: "Progress reporting", text: "Track completion across teams for training records." },
  { icon: FileCheck2, title: "Verifiable certificates", text: "Every learner receives a certificate with a verification ID." },
  { icon: Building2, title: "Custom content", text: "Examples and case scenarios adapted to your setting." },
];

export default function InstitutionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="For Institutions"
        title="AI training for your healthcare workforce"
        description="Help your staff use AI tools productively — and safely — with structured, healthcare-specific training."
        breadcrumbs={[{ name: "For Institutions", href: "/institutions" }]}
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" variant="teal">
            <a href="#enquiry">Send an enquiry</a>
          </Button>
          <Button asChild size="lg" variant="outline-light">
            <Link href="/book">Book a discovery call</Link>
          </Button>
        </div>
      </PageHeader>

      <Section id="why-train">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4 text-lg text-foreground/85">
            <h2 className="text-3xl font-semibold sm:text-4xl">Your staff are already using AI. Are they using it safely?</h2>
            <p>
              Healthcare workers increasingly use AI tools for writing, research and administration — often on personal
              accounts and without guidance. That creates risks for patient confidentiality, accuracy and your
              organisation&apos;s reputation.
            </p>
            <p>
              Structured training turns informal, risky use into consistent, governed practice — and helps your teams
              save time on communication, education and administrative work.
            </p>
          </div>
          <StockPhoto src={stockPhotos.institutions.src} alt={stockPhotos.institutions.alt} className="aspect-[4/3]" />
        </div>
      </Section>

      <Section id="benefits" muted eyebrow="What we offer" title="Training programmes built around your organisation">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <li key={b.title} className="rounded-xl border bg-card p-6 shadow-sm">
              <b.icon className="size-7 text-teal" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="enquiry" eyebrow="Enquiry" title="Tell us about your training needs" description="We will reply within two working days with options and pricing.">
        <div className="max-w-3xl rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          <InstitutionForm />
        </div>
      </Section>
    </>
  );
}
