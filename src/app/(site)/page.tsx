import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  GraduationCap,
  HeartPulse,
  Hospital,
  Pill,
  Quote,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

import { Section } from "@/components/common/section";
import { CourseCard } from "@/components/course/course-card";
import { PriceTag } from "@/components/course/price-tag";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { HeroIllustration } from "@/components/illustrations/hero-illustration";
import { HeartbeatLine, NetworkPattern } from "@/components/illustrations/patterns";
import { BrowseIcon, CertifiedIcon, EnrollIcon, LearnIcon } from "@/components/illustrations/step-icons";
import { JsonLd } from "@/components/seo/json-ld";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { featuredFaqs } from "@/config/faq";
import { safetyPrinciples, testimonials, trustIndicators } from "@/config/home";
import { siteConfig } from "@/config/site";
import { getAllCourses, toCourseSummary } from "@/lib/content/courses";
import { createMetadata, faqJsonLd, organizationJsonLd } from "@/lib/seo";

export const metadata = createMetadata({
  title: `${siteConfig.name} — AI skills built for healthcare professionals`,
  description: siteConfig.description,
  path: "/",
});

const roles = [
  { icon: Stethoscope, title: "Doctors", text: "Patient information, teaching sessions, presentations and research posters." },
  { icon: HeartPulse, title: "Nurses", text: "Discharge advice, ward induction packs, training material and patient education." },
  { icon: Pill, title: "Pharmacists", text: "Medication leaflets, counselling aids and clear guidance for colleagues." },
  { icon: Users, title: "Allied health", text: "Exercise sheets, dietary advice, lab and imaging information that patients understand." },
  { icon: Hospital, title: "Admin staff", text: "Policies, reports, staff communication and patient-facing letters." },
  { icon: GraduationCap, title: "Students", text: "Case presentations, posters, revision material and professional skills." },
];

const steps = [
  { icon: BrowseIcon, title: "Browse", text: "Explore courses built for your role and preview lessons for free." },
  { icon: EnrollIcon, title: "Enroll", text: "Pay securely by bank transfer, JazzCash or Easypaisa — access within 24 hours." },
  { icon: LearnIcon, title: "Learn", text: "Short, practical lessons with exercises you can finish between shifts." },
  { icon: CertifiedIcon, title: "Get certified", text: "Complete the course and download a verifiable certificate." },
];

export default function HomePage() {
  const courses = getAllCourses();
  const featured = courses.find((c) => c.featured && c.published) ?? courses[0];

  return (
    <>
      <JsonLd data={[organizationJsonLd(), faqJsonLd(featuredFaqs)]} />

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-50 to-background">
        <NetworkPattern className="text-primary opacity-50" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="animate-fade-up">
            <Badge variant="teal" className="mb-5">
              <ShieldCheck aria-hidden="true" />
              Safety-first AI education for healthcare
            </Badge>
            <h1 className="text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
              AI skills built for <span className="text-teal">healthcare professionals</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
              Learn to use AI tools such as Claude to create patient leaflets, presentations, posters and staff training
              — faster, more clearly and without compromising patient privacy.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="teal">
                <Link href="/courses">
                  Explore courses
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              {featured ? (
                <Button asChild size="lg" variant="outline">
                  <Link href={`/courses/${featured.slug}`}>Preview a free lesson</Link>
                </Button>
              ) : null}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              For doctors, nurses, pharmacists, allied health professionals, hospital staff and students.
            </p>
          </div>
          <div className="mx-auto w-full max-w-lg lg:max-w-none">
            <HeroIllustration className="h-auto w-full" />
          </div>
        </div>
      </section>

      {/* ---------------- Trust indicators ---------------- */}
      <section aria-label="Why learners trust us" className="border-y bg-background">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trustIndicators.map((item) => (
            <li key={item.value} className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden="true" />
              <div>
                <p className="font-serif text-lg font-semibold text-primary">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------- Who it's for ---------------- */}
      <Section
        id="who"
        eyebrow="Who it's for"
        title="Designed around the work you actually do"
        description="Every course uses realistic healthcare examples, so you can apply what you learn the same day."
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <li key={role.title} className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <span className="inline-flex size-11 items-center justify-center rounded-lg bg-teal-50 text-teal">
                <role.icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-semibold">{role.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{role.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------------- Featured course ---------------- */}
      {featured ? (
        <Section id="featured" muted eyebrow="Featured course" title={featured.title}>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <CourseCard course={toCourseSummary(featured)} />
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">{featured.description}</p>
              <div>
                <h3 className="text-xl font-semibold">What you&apos;ll learn</h3>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {featured.outcomes.slice(0, 6).map((outcome) => (
                    <li key={outcome} className="flex gap-2 text-sm">
                      <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <PriceTag price={featured.price} size="lg" />
                  <p className="text-sm text-muted-foreground">
                    {featured.lessonCount} lessons · {featured.duration} · Certificate included
                  </p>
                </div>
                <Button asChild size="lg">
                  <Link href={`/courses/${featured.slug}`}>View course</Link>
                </Button>
              </div>
            </div>
          </div>
        </Section>
      ) : null}

      {/* ---------------- How it works ---------------- */}
      <Section id="how" eyebrow="How it works" title="From first lesson to certificate in four steps" align="center">
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="relative rounded-xl border bg-card p-6 text-center shadow-sm">
              <span className="absolute top-4 left-4 text-xs font-semibold text-muted-foreground">0{index + 1}</span>
              <step.icon className="mx-auto size-12 text-teal" />
              <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------------- Learning outcomes ---------------- */}
      <section aria-labelledby="outcomes-heading" className="relative overflow-hidden bg-primary py-16 text-white sm:py-20">
        <NetworkPattern className="text-teal-soft" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-wide text-teal-soft uppercase">Learning outcomes</p>
            <h2 id="outcomes-heading" className="text-3xl font-semibold text-white sm:text-4xl">
              Practical skills you can use on your next shift
            </h2>
            <HeartbeatLine className="mt-6 text-teal-soft" />
            <p className="mt-6 text-lg text-white/85">
              Our courses focus on everyday communication and education tasks where AI saves real time — and on the
              judgement needed to use it responsibly.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              "Write prompts that produce accurate, well-structured drafts",
              "Turn technical information into plain language patients understand",
              "Design professional leaflets, posters and presentations",
              "Create training material, case scenarios and quizzes",
              "Protect patient privacy and follow institutional policy",
              "Check AI output for accuracy, bias and readability",
            ].map((item) => (
              <li key={item} className="rounded-lg border border-white/15 bg-white/5 p-4 text-sm text-white/90">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- Safe use of AI ---------------- */}
      <Section
        id="safety"
        eyebrow="Safe use of AI in healthcare"
        title="Four principles behind every lesson"
        description="AI can improve healthcare communication — but only when used with care. These principles run through all our courses."
      >
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {safetyPrinciples.map((principle, index) => (
            <li key={principle.title} className="rounded-xl border-t-4 border-t-teal bg-card p-6 shadow-sm ring-1 ring-border">
              <p className="font-serif text-3xl font-semibold text-teal/80">{index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold">{principle.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{principle.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          Read more in our article on{" "}
          <Link href="/blog/patient-privacy-and-ai-tools" className="text-teal underline underline-offset-2">
            patient privacy and AI tools
          </Link>
          .
        </p>
      </Section>

      {/* ---------------- Testimonials (placeholders) ---------------- */}
      <Section id="testimonials" muted eyebrow="What learners say" title="Trusted by healthcare professionals">
        <ul className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <li key={i} className="flex flex-col rounded-xl border bg-card p-6 shadow-sm">
              {t.placeholder ? (
                <Badge variant="warning" className="mb-3">
                  Placeholder — replace before launch
                </Badge>
              ) : null}
              <Quote className="size-6 text-teal" aria-hidden="true" />
              <blockquote className="mt-3 flex-1 text-foreground/90">{t.quote}</blockquote>
              <p className="mt-4 text-sm font-semibold text-primary">{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.role}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------------- FAQ preview ---------------- */}
      <Section id="faq" eyebrow="FAQ" title="Common questions">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <Accordion type="single" collapsible className="rounded-xl border bg-card px-4 sm:px-6">
            {featuredFaqs.map((faq, i) => (
              <AccordionItem key={faq.question} value={`faq-${i}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="rounded-xl bg-navy-50 p-6">
            <h3 className="text-xl font-semibold">Still have questions?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Browse all FAQs or get in touch — we&apos;re happy to help.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild variant="outline">
                <Link href="/faq">See all FAQs</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------- Newsletter ---------------- */}
      <section aria-labelledby="newsletter-heading" className="border-y bg-teal-50 py-14">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-xl">
            <h2 id="newsletter-heading" className="text-2xl font-semibold sm:text-3xl">
              Practical AI tips for healthcare, once a month
            </h2>
            <p className="mt-2 text-muted-foreground">New guides, safe-use updates and course news. Unsubscribe anytime.</p>
          </div>
          <div className="w-full max-w-md">
            <NewsletterForm source="home" />
          </div>
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section aria-labelledby="cta-heading" className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 id="cta-heading" className="text-3xl font-semibold sm:text-4xl">
            Start learning AI the safe, professional way
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Preview the first lessons free. Enrol when you&apos;re ready — your progress is saved automatically.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="teal">
              <Link href="/signup">Create a free account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/institutions">Training for your institution</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
