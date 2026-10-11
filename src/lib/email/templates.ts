/**
 * Email templates. Each returns { subject, html, text }.
 * Plain, professional HTML that renders well in Gmail/Outlook on phones.
 */
import { siteConfig } from "@/config/site";

type Email = { subject: string; html: string; text: string };

/** Escape user-provided text before putting it into HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en"><body style="margin:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;">
<tr><td style="background:#0b2545;padding:20px 24px;border-radius:10px 10px 0 0;">
<span style="font-family:Georgia,serif;font-size:20px;color:#ffffff;font-weight:bold;">${escapeHtml(siteConfig.name)}</span>
<div style="font-size:12px;color:#ccfbf1;margin-top:4px;">${escapeHtml(siteConfig.tagline)}</div>
</td></tr>
<tr><td style="padding:24px;">
<h1 style="font-family:Georgia,serif;font-size:20px;color:#0b2545;margin:0 0 16px;">${escapeHtml(title)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#475569;">
This email was sent by ${escapeHtml(siteConfig.name)} · <a href="${siteConfig.url}" style="color:#0f766e;">${siteConfig.url.replace(/^https?:\/\//, "")}</a><br/>
Educational content only — not medical advice.
</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (text: string) => `<p style="font-size:15px;line-height:1.6;margin:0 0 14px;">${text}</p>`;
const button = (href: string, label: string) =>
  `<p style="margin:20px 0;"><a href="${href}" style="background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold;display:inline-block;">${escapeHtml(label)}</a></p>`;

function rows(data: Record<string, string | undefined>): string {
  return `<table role="presentation" cellpadding="6" cellspacing="0" style="font-size:14px;border-collapse:collapse;width:100%;">${Object.entries(
    data,
  )
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="color:#475569;vertical-align:top;width:35%;border-bottom:1px solid #f1f5f9;">${escapeHtml(k)}</td><td style="border-bottom:1px solid #f1f5f9;white-space:pre-wrap;">${escapeHtml(v ?? "")}</td></tr>`,
    )
    .join("")}</table>`;
}

function textRows(data: Record<string, string | undefined>): string {
  return Object.entries(data)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

/* --------------------------- Learner emails --------------------------- */

export function paymentReceivedEmail(args: { name: string; courseTitle: string; amount: string }): Email {
  const subject = `We received your payment details — ${args.courseTitle}`;
  return {
    subject,
    html: layout(
      "Payment received — pending verification",
      p(`Dear ${escapeHtml(args.name)},`) +
        p(
          `Thank you for enrolling in <strong>${escapeHtml(args.courseTitle)}</strong>. We have received your payment details (${escapeHtml(args.amount)}) and will verify them shortly — usually within 24 hours on working days.`,
        ) +
        p("You will receive another email as soon as your access is activated.") +
        button(`${siteConfig.url}/dashboard`, "Go to my dashboard"),
    ),
    text: `Dear ${args.name},\n\nThank you for enrolling in ${args.courseTitle}. We received your payment details (${args.amount}) and will verify them shortly — usually within 24 hours on working days.\n\nDashboard: ${siteConfig.url}/dashboard`,
  };
}

export function enrollmentApprovedEmail(args: { name: string; courseTitle: string; courseSlug: string }): Email {
  const url = `${siteConfig.url}/learn/${args.courseSlug}`;
  return {
    subject: `You're enrolled: ${args.courseTitle}`,
    html: layout(
      "Your enrolment is confirmed",
      p(`Dear ${escapeHtml(args.name)},`) +
        p(`Your access to <strong>${escapeHtml(args.courseTitle)}</strong> is now active. You can start learning straight away and continue at your own pace.`) +
        button(url, "Start learning") +
        p(
          "A reminder: never enter identifiable patient information into AI tools, and always follow your institution's policies.",
        ),
    ),
    text: `Dear ${args.name},\n\nYour access to ${args.courseTitle} is now active.\nStart learning: ${url}\n\nReminder: never enter identifiable patient information into AI tools.`,
  };
}

export function enrollmentRejectedEmail(args: { name: string; courseTitle: string; courseSlug: string; note?: string }): Email {
  const url = `${siteConfig.url}/enroll/${args.courseSlug}`;
  return {
    subject: `Action needed: your payment for ${args.courseTitle}`,
    html: layout(
      "We could not verify your payment",
      p(`Dear ${escapeHtml(args.name)},`) +
        p(`Unfortunately we could not verify your payment for <strong>${escapeHtml(args.courseTitle)}</strong>.`) +
        (args.note ? p(`<strong>Note from our team:</strong> ${escapeHtml(args.note)}`) : "") +
        p("Please check your transaction details and submit them again, or reply to this email and we will help.") +
        button(url, "Resubmit payment details"),
    ),
    text: `Dear ${args.name},\n\nWe could not verify your payment for ${args.courseTitle}.${args.note ? `\nNote: ${args.note}` : ""}\nResubmit: ${url}`,
  };
}

export function certificateIssuedEmail(args: { name: string; courseTitle: string; code: string }): Email {
  const verifyUrl = `${siteConfig.url}/verify/${args.code}`;
  return {
    subject: `Congratulations! Your certificate for ${args.courseTitle}`,
    html: layout(
      "You have completed the course",
      p(`Dear ${escapeHtml(args.name)},`) +
        p(`Congratulations on completing <strong>${escapeHtml(args.courseTitle)}</strong>. Your certificate is ready to download from your dashboard.`) +
        p(`Certificate ID: <strong>${escapeHtml(args.code)}</strong>`) +
        button(`${siteConfig.url}/dashboard/certificates`, "Download certificate") +
        p(`Anyone can confirm your certificate at <a href="${verifyUrl}" style="color:#0f766e;">${verifyUrl}</a>.`),
    ),
    text: `Dear ${args.name},\n\nCongratulations on completing ${args.courseTitle}.\nCertificate ID: ${args.code}\nDownload: ${siteConfig.url}/dashboard/certificates\nVerify: ${verifyUrl}`,
  };
}

/* ---------------------------- Admin emails ---------------------------- */

export function adminNewPaymentEmail(args: {
  name: string;
  email: string;
  courseTitle: string;
  method: string;
  transactionId: string;
  amount: string;
}): Email {
  const data = {
    Learner: args.name,
    Email: args.email,
    Course: args.courseTitle,
    Amount: args.amount,
    Method: args.method,
    "Transaction ID": args.transactionId,
  };
  return {
    subject: `New payment to review — ${args.courseTitle}`,
    html: layout("New payment awaiting review", rows(data) + button(`${siteConfig.url}/admin/enrollments`, "Review in admin panel")),
    text: `New payment awaiting review\n\n${textRows(data)}\n\n${siteConfig.url}/admin/enrollments`,
  };
}

export function adminContactEmail(args: { name: string; email: string; subject: string; message: string }): Email {
  const data = { Name: args.name, Email: args.email, Subject: args.subject, Message: args.message };
  return {
    subject: `Contact form: ${args.subject}`,
    html: layout("New contact message", rows(data)),
    text: `New contact message\n\n${textRows(data)}`,
  };
}

export function adminInstitutionEmail(args: Record<string, string | undefined>): Email {
  return {
    subject: `Institution enquiry: ${args.Organisation ?? ""}`,
    html: layout("New institutional training enquiry", rows(args) + button(`${siteConfig.url}/admin/enquiries`, "Open admin panel")),
    text: `New institutional training enquiry\n\n${textRows(args)}`,
  };
}
