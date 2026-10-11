import Link from "next/link";
import { Clock, Mail, MessageCircle } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { WhatsAppButton } from "@/components/common/whatsapp-button";
import { ContactForm } from "@/components/forms/contact-form";
import { siteConfig } from "@/config/site";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Contact us",
  description: `Get in touch with ${siteConfig.name} by email, WhatsApp or our contact form. We usually reply within two working days.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHeader title="Contact us" description="Questions about a course, payment or group training? We're happy to help." breadcrumbs={[{ name: "Contact", href: "/contact" }]} />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8">
        <section aria-labelledby="form-heading" className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 id="form-heading" className="text-2xl font-semibold">
            Send us a message
          </h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">Fields marked * are required.</p>
          <ContactForm />
        </section>
        <aside className="space-y-6">
          <div className="rounded-xl bg-navy-50 p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <MessageCircle className="size-5 text-teal" aria-hidden="true" />
              Chat with us
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Quick questions? Message us on WhatsApp.</p>
            <WhatsAppButton className="mt-4 w-full" />
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Mail className="size-5 text-teal" aria-hidden="true" />
              Email
            </h2>
            <a href={`mailto:${siteConfig.contact.email}`} className="mt-2 inline-block text-teal underline">
              {siteConfig.contact.email}
            </a>
            <h2 className="mt-6 flex items-center gap-2 text-xl font-semibold">
              <Clock className="size-5 text-teal" aria-hidden="true" />
              Hours
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{siteConfig.contact.hours}</p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            Planning training for a hospital or clinic? Use our{" "}
            <Link href="/institutions" className="text-teal underline">
              institutions enquiry form
            </Link>{" "}
            or{" "}
            <Link href="/book" className="text-teal underline">
              book a call
            </Link>
            .
          </div>
        </aside>
      </div>
    </>
  );
}
