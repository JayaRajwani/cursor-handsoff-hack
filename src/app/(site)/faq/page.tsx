import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { JsonLd } from "@/components/seo/json-ld";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { allFaqs, faqGroups } from "@/config/faq";
import { createMetadata, faqJsonLd } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Frequently asked questions",
  description:
    "Answers about our AI courses for healthcare professionals: enrolment, payment by bank transfer, JazzCash or Easypaisa, certificates, safety and accounts.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(allFaqs)} />
      <PageHeader title="Frequently asked questions" description="Everything you need to know about our courses." breadcrumbs={[{ name: "FAQ", href: "/faq" }]} />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <nav aria-label="FAQ categories" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col">
            {faqGroups.map((group) => (
              <li key={group.slug}>
                <a href={`#${group.slug}`} className="block rounded-md border px-3 py-1.5 text-sm hover:border-teal hover:text-teal lg:border-0">
                  {group.category}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-10">
          {faqGroups.map((group) => (
            <section key={group.slug} id={group.slug} aria-labelledby={`${group.slug}-heading`} className="scroll-mt-24">
              <h2 id={`${group.slug}-heading`} className="text-2xl font-semibold">
                {group.category}
              </h2>
              <Accordion type="multiple" className="mt-4 rounded-xl border bg-card px-4 sm:px-6">
                {group.faqs.map((faq, i) => (
                  <AccordionItem key={faq.question} value={`${group.slug}-${i}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
          <p className="text-muted-foreground">
            Can&apos;t find your answer?{" "}
            <Link href="/contact" className="text-teal underline">
              Contact us
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
