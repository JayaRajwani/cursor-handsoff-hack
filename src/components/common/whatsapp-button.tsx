import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Simple WhatsApp chat icon (drawn for this site; not the official logo). */
function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.2A8.5 8.5 0 1 1 20 11.5Z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a3.5 3.5 0 0 1-1.8-1.8l.8-1-1-2Z" />
    </svg>
  );
}

export function whatsappHref(message: string = siteConfig.contact.whatsappMessage) {
  return `https://wa.me/${siteConfig.contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** "Chat on WhatsApp" button. The number is set in src/config/site.ts. */
export function WhatsAppButton({ className, label = "Chat on WhatsApp" }: { className?: string; label?: string }) {
  return (
    <a
      href={whatsappHref()}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#1f7a4d] px-5 font-medium text-white shadow-sm transition-colors hover:bg-[#186440]",
        className,
      )}
    >
      <ChatIcon className="size-5" />
      {label}
      <span className="sr-only">(opens WhatsApp in a new tab)</span>
    </a>
  );
}
