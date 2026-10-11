import Link from "next/link";
import { Award, BookOpenCheck, HeartHandshake, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { StockPhoto } from "@/components/common/stock-photo";
import { Button } from "@/components/ui/button";
import { stockPhotos } from "@/config/images";
import { siteConfig } from "@/config/site";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "About us — our mission",
  description: `Why ${siteConfig.name} exists: helping healthcare professionals use AI tools safely, confidently and effectively.`,
  path: "/about",
});

const values = [
  { icon: ShieldCheck, title: "Safety first", text: "Patient privacy and clinical accuracy come before speed or convenience." },
  { icon: BookOpenCheck, title: "Practical", text: "Every lesson is built around a real task you can complete the same day." },
  { icon: HeartHandshake, title: "Respectful", text: "We write for busy professionals: clear, honest and free of hype." },
  { icon: Award, title: "Rigorous", text: "Content is reviewed, regularly updated and transparent about AI's limits." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About us"
        description={`${siteConfig.name} helps healthcare professionals build practical, responsible AI skills.`}
        breadcrumbs={[{ name: "About", href: "/about" }]}
      />

      <Section id="mission">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-wide text-teal uppercase">Our mission</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Helping healthcare adopt AI safely and confidently</h2>
            <div className="mt-6 space-y-4 text-lg text-foreground/85">
              <p>
                AI tools are changing how information is written, designed and shared. Healthcare professionals are
                already using them — often without training, and sometimes without realising the risks to patient
                privacy and accuracy.
              </p>
              <p>
                Our mission is to give doctors, nurses, pharmacists, allied health professionals, administrators and
                students the practical skills to use AI well: saving time on communication and education work while
                protecting patients and upholding professional standards.
              </p>
            </div>
          </div>
          <StockPhoto src={stockPhotos.about.src} alt={stockPhotos.about.alt} className="aspect-[4/3]" priority />
        </div>
      </Section>

      <Section id="why" muted eyebrow="Why it matters" title="Why AI matters in healthcare">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-xl font-semibold">Time is the scarcest resource</h3>
            <p className="mt-2 text-muted-foreground">
              Clinicians spend hours on leaflets, presentations, teaching and paperwork. Used well, AI can return some of
              that time to patient care.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold">Communication saves lives</h3>
            <p className="mt-2 text-muted-foreground">
              Clear, accessible information improves understanding, adherence and safety. AI makes high-quality plain
              language easier to produce.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold">Untrained use is risky</h3>
            <p className="mt-2 text-muted-foreground">
              Without training, AI use can lead to privacy breaches, inaccurate advice and loss of trust. Education is the
              best safeguard.
            </p>
          </div>
        </div>
      </Section>

      <Section id="values" eyebrow="Our values" title="How we teach">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <li key={v.title} className="rounded-xl border bg-card p-6 shadow-sm">
              <v.icon className="size-7 text-teal" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="instructor" muted eyebrow="Instructor" title="Meet your instructor">
        <div className="grid gap-8 rounded-xl border bg-card p-6 sm:p-8 md:grid-cols-[200px_1fr]">
          <div className="flex aspect-square w-40 items-center justify-center rounded-full bg-navy-50 font-serif text-5xl font-semibold text-primary md:w-full" aria-hidden="true">
            {siteConfig.instructor.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <p className="inline-block rounded bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
              PLACEHOLDER — REVIEW BEFORE LAUNCH
            </p>
            <h3 className="mt-3 text-2xl font-semibold">{siteConfig.instructor.name}</h3>
            <p className="text-teal">{siteConfig.instructor.title}</p>
            <div className="mt-4 space-y-3 text-foreground/85">
              {siteConfig.instructor.bio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {siteConfig.instructor.credentials.map((c) => (
                <li key={c} className="rounded-full border px-3 py-1 text-sm">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <section className="py-16 text-center">
        <h2 className="text-3xl font-semibold">Ready to start?</h2>
        <div className="mt-6 flex flex-col justify-center gap-3 px-4 sm:flex-row">
          <Button asChild size="lg" variant="teal">
            <Link href="/courses">Browse courses</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
