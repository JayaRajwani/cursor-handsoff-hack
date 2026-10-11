/**
 * Sends emails with Resend (https://resend.com — free plan: 3,000 emails/month).
 *
 * If RESEND_API_KEY is not set (e.g. while developing), emails are printed
 * to the terminal instead of being sent, so nothing crashes.
 */
import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

/** The "From" address. Must be on a domain you verified in Resend. */
const FROM = process.env.EMAIL_FROM || "MedAI Academy <onboarding@resend.dev>";

/** Where admin notifications (new payments, contact messages…) are sent. */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/** Send an email. Never throws — returns false if sending failed. */
export async function sendEmail({ to, subject, html, text, replyTo }: SendArgs): Promise<boolean> {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return false;

  if (!resend) {
    console.info(`[email:dev] RESEND_API_KEY not set. Would send "${subject}" to ${recipients.join(", ")}`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({ from: FROM, to: recipients, subject, html, text, replyTo });
    if (error) {
      console.error("[email] Resend error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}

/** Convenience helper for notifications to the site owner. */
export async function sendAdminEmail(args: Omit<SendArgs, "to">) {
  if (!ADMIN_EMAIL) {
    console.info(`[email] ADMIN_EMAIL not set. Skipping admin notification "${args.subject}".`);
    return false;
  }
  return sendEmail({ ...args, to: ADMIN_EMAIL });
}
