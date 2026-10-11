"use server";

/**
 * Server Actions for the public forms: newsletter, contact and institutions.
 * Each one: 1) checks the honeypot, 2) validates with zod,
 * 3) saves to Supabase, 4) emails the site owner.
 */
import { adminContactEmail, adminInstitutionEmail } from "@/lib/email/templates";
import { sendAdminEmail } from "@/lib/email/send";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import {
  contactSchema,
  fieldErrors,
  formToObject,
  institutionSchema,
  isSpam,
  newsletterSchema,
  type FormState,
} from "@/lib/validation";

const NOT_CONFIGURED: FormState = {
  status: "error",
  message: "This form is not connected yet. Please email us directly instead.",
};

// Bots get a fake "success" so they don't retry.
const FAKE_SUCCESS: FormState = { status: "success", message: "Thank you!" };

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isSpam(formData)) return FAKE_SUCCESS;
  const values = formToObject(formData);
  const parsed = newsletterSchema.safeParse(values);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };
  if (!isAdminClientConfigured) return NOT_CONFIGURED;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert({ email: parsed.data.email, source: parsed.data.source ?? "website" }, { onConflict: "email", ignoreDuplicates: true });

  if (error) {
    console.error("[newsletter]", error.message);
    return { status: "error", message: "Sorry, something went wrong. Please try again later.", values };
  }
  return { status: "success", message: "Thank you for subscribing. We send one useful email a month — no spam." };
}

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isSpam(formData)) return FAKE_SUCCESS;
  const values = formToObject(formData);
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };
  if (!isAdminClientConfigured) return NOT_CONFIGURED;

  const supabase = createAdminClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });
  if (error) {
    console.error("[contact]", error.message);
    return { status: "error", message: "Sorry, your message could not be sent. Please try again later.", values };
  }

  await sendAdminEmail({ ...adminContactEmail(parsed.data), replyTo: parsed.data.email });
  return { status: "success", message: "Thank you — your message has been sent. We usually reply within two working days." };
}

export async function submitInstitutionEnquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isSpam(formData)) return FAKE_SUCCESS;
  const values = formToObject(formData);
  const parsed = institutionSchema.safeParse(values);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };
  if (!isAdminClientConfigured) return NOT_CONFIGURED;

  const d = parsed.data;
  const supabase = createAdminClient();
  const { error } = await supabase.from("institution_enquiries").insert({
    organization: d.organization,
    contact_name: d.contactName,
    email: d.email,
    phone: d.phone || null,
    role: d.role || null,
    staff_count: d.staffCount,
    message: d.message,
  });
  if (error) {
    console.error("[institutions]", error.message);
    return { status: "error", message: "Sorry, your enquiry could not be sent. Please try again later.", values };
  }

  await sendAdminEmail({
    ...adminInstitutionEmail({
      Organisation: d.organization,
      Contact: d.contactName,
      Email: d.email,
      Phone: d.phone,
      Role: d.role,
      "Staff to train": d.staffCount,
      Message: d.message,
    }),
    replyTo: d.email,
  });
  return {
    status: "success",
    message: "Thank you — we have received your enquiry and will contact you within two working days.",
  };
}
