import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { footerNav, siteConfig } from "@/config/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto bg-navy-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div className="space-y-4">
            <Logo inverted />
            <p className="max-w-sm text-sm text-white/80">{siteConfig.description}</p>
            <div className="max-w-sm">
              <p className="mb-2 text-sm font-semibold text-white">Monthly newsletter</p>
              <NewsletterForm variant="dark" source="footer" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerNav.map((group) => (
              <div key={group.title}>
                <h2 className="font-sans text-sm font-semibold tracking-wide text-white uppercase">{group.title}</h2>
                <ul className="mt-3 space-y-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-white/80 hover:text-white hover:underline">
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Healthcare disclaimer — required on every page */}
        <div className="mt-10 flex gap-3 rounded-lg border border-white/15 bg-white/5 p-4 text-sm text-white/85">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-teal-soft" aria-hidden="true" />
          <p>
            <strong className="text-white">Educational content only.</strong> {siteConfig.name} courses and articles are
            for professional education and do not constitute medical advice. Learners must follow their
            institution&apos;s policies, professional guidance and local regulations when using AI tools. Never enter
            identifiable patient information into AI tools. See our{" "}
            <Link href="/legal/medical-disclaimer" className="underline hover:text-white">
              medical disclaimer
            </Link>
            .
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/15 pt-6 text-xs text-white/70 sm:flex-row sm:justify-between">
          <p>
            © {year} {siteConfig.legalName}. All rights reserved.
          </p>
          <p>
            AI tool names mentioned on this site are trademarks of their owners. {siteConfig.name} is independent and not
            affiliated with or endorsed by them.
          </p>
        </div>
      </div>
    </footer>
  );
}
