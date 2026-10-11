/**
 * Form validation rules (zod). The same rules run on the server for every
 * form, so nobody can bypass them by editing the page in their browser.
 */
import { z } from "zod";

/** Hidden "honeypot" field. Real people never fill it in; spam bots do. */
export const HONEYPOT_FIELD = "company_website";

const email = z.string().trim().toLowerCase().max(254).pipe(z.email("Please enter a valid email address."));
const name = z.string().trim().min(2, "Please enter your name.").max(120);

export const PROFESSIONS = [
  "Doctor",
  "Nurse",
  "Pharmacist",
  "Allied health professional",
  "Hospital administration / management",
  "Medical student",
  "Other",
] as const;

export const newsletterSchema = z.object({
  email,
  source: z.string().max(40).optional(),
});

export const contactSchema = z.object({
  name,
  email,
  subject: z.string().trim().min(3, "Please add a short subject.").max(150),
  message: z.string().trim().min(20, "Please write at least 20 characters.").max(5000),
});

export const institutionSchema = z.object({
  organization: z.string().trim().min(2, "Please enter your organisation's name.").max(200),
  contactName: name,
  email,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  role: z.string().trim().max(120).optional().or(z.literal("")),
  staffCount: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"], {
    message: "Please choose an approximate number of staff.",
  }),
  message: z.string().trim().min(20, "Please tell us a little about your training needs (20+ characters).").max(5000),
});

export const signupSchema = z.object({
  fullName: name,
  email,
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
  profession: z.enum(PROFESSIONS, { message: "Please choose your profession." }),
  acceptTerms: z.literal("on", { message: "Please accept the Terms of Service and Privacy Policy." }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Please enter your password."),
});

export const emailOnlySchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters.").max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  fullName: name,
  profession: z.enum(PROFESSIONS, { message: "Please choose your profession." }),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
});

export const paymentSubmissionSchema = z.object({
  courseSlug: z.string().min(1),
  method: z.enum(["bank_transfer", "jazzcash", "easypaisa"], { message: "Please choose how you paid." }),
  transactionId: z
    .string()
    .trim()
    .min(4, "Please enter the transaction / reference ID from your receipt.")
    .max(100),
  payerName: z.string().trim().min(2, "Please enter the name on the paying account.").max(120),
});

export const manualEnrollSchema = z.object({
  email,
  courseSlug: z.string().min(1, "Please choose a course."),
});

export const reviewPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

/** Turn zod errors into { fieldName: "first error message" } for the form UI. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

/** The shape every form action returns. */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
  /** Echo back user input so the form isn't wiped after an error. */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

/** Read FormData into a plain object of strings. */
export function formToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !key.startsWith("$ACTION")) result[key] = value;
  });
  return result;
}

/** True if the honeypot field was filled in (i.e. probably a bot). */
export function isSpam(formData: FormData): boolean {
  const value = formData.get(HONEYPOT_FIELD);
  return typeof value === "string" && value.trim().length > 0;
}
