/**
 * ============================================================
 *  SITE CONFIGURATION — edit this file to rebrand the website
 * ============================================================
 * Everything here is safe to change. After editing, restart
 * `npm run dev` (or push to GitHub to redeploy on Vercel).
 */

export const siteConfig = {
  /** Brand name shown in the header, footer, emails and certificates. */
  name: "MedAI Academy",

  /** Short line shown under the logo and in search results. */
  tagline: "AI skills for healthcare professionals",

  /** Default description used for search engines and social sharing. */
  description:
    "Practical, safety-first online courses that teach doctors, nurses, pharmacists, allied health professionals and hospital staff how to use AI tools effectively in their daily work.",

  /**
   * Public URL of the website. Set NEXT_PUBLIC_SITE_URL in your environment
   * (e.g. https://medaiacademy.com). Falls back to localhost for development.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),

  /** Legal entity / organisation name used in policies and structured data. */
  legalName: "MedAI Academy",

  /** Country you operate from (used in legal pages and structured data). */
  country: "Pakistan",

  contact: {
    /** Public email shown on the Contact page. */
    email: "hello@medaiacademy.com",
    /**
     * WhatsApp number in international format WITHOUT "+" or spaces,
     * e.g. 923001234567 for +92 300 1234567. (REPLACE BEFORE LAUNCH)
     */
    whatsappNumber: "923000000000",
    /** Pre-filled message when someone taps the WhatsApp button. */
    whatsappMessage: "Hello MedAI Academy, I have a question about your courses.",
    /** Office hours shown on the Contact page. */
    hours: "Monday – Friday, 10:00 – 18:00 (PKT)",
  },

  /**
   * Cal.com booking link used on the "Book a session" page.
   * Create a free account at https://cal.com, create an event type and paste
   * its link here, e.g. "https://cal.com/your-name/30min". (REPLACE BEFORE LAUNCH)
   */
  calLink: process.env.NEXT_PUBLIC_CAL_LINK || "https://cal.com/your-username/consultation",

  /** Social profiles (leave empty strings to hide). */
  social: {
    linkedin: "",
    x: "",
    youtube: "",
    facebook: "",
  },

  /** Instructor shown on course pages and the About page. (REPLACE BEFORE LAUNCH) */
  instructor: {
    name: "Dr. Your Name",
    title: "Physician & Healthcare AI Educator",
    bio: [
      "PLACEHOLDER BIO — REPLACE BEFORE LAUNCH. Write two or three short paragraphs about your clinical background, your experience with AI tools, and why you started teaching healthcare professionals.",
      "Mention your qualifications, the institutions you have worked with, and any relevant publications, talks or training programmes you have delivered.",
    ],
    credentials: ["MBBS (placeholder)", "Clinical experience (placeholder)", "AI education (placeholder)"],
  },
} as const;

export type SiteConfig = typeof siteConfig;

/** Main navigation links in the header. */
export const mainNav = [
  { title: "Courses", href: "/courses" },
  { title: "For Institutions", href: "/institutions" },
  { title: "Blog", href: "/blog" },
  { title: "About", href: "/about" },
  { title: "FAQ", href: "/faq" },
  { title: "Contact", href: "/contact" },
] as const;

/** Footer link groups. */
export const footerNav = [
  {
    title: "Learn",
    links: [
      { title: "All courses", href: "/courses" },
      { title: "Blog", href: "/blog" },
      { title: "Book a session", href: "/book" },
      { title: "Verify a certificate", href: "/verify" },
    ],
  },
  {
    title: "Organisation",
    links: [
      { title: "About", href: "/about" },
      { title: "For Institutions", href: "/institutions" },
      { title: "FAQ", href: "/faq" },
      { title: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { title: "Privacy Policy", href: "/legal/privacy" },
      { title: "Terms of Service", href: "/legal/terms" },
      { title: "Refund Policy", href: "/legal/refunds" },
      { title: "Medical Disclaimer", href: "/legal/medical-disclaimer" },
    ],
  },
] as const;
