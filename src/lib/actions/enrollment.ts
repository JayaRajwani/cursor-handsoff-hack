"use server";

/**
 * Enrolment actions: submit a manual payment, or enrol in a free course.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { formatPkr, paymentConfig } from "@/config/payment";
import { getUser } from "@/lib/auth";
import { getCourse, getCourseLessons } from "@/lib/content/courses";
import { sendAdminEmail, sendEmail } from "@/lib/email/send";
import { adminNewPaymentEmail, paymentReceivedEmail } from "@/lib/email/templates";
import { getPaymentProvider } from "@/lib/payments";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, formToObject, paymentSubmissionSchema, type FormState } from "@/lib/validation";

export async function submitManualPayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { status: "error", message: "Please log in again to continue." };

  const values = formToObject(formData);
  const parsed = paymentSubmissionSchema.safeParse(values);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  const course = getCourse(parsed.data.courseSlug);
  if (!course || !course.published) return { status: "error", message: "This course is not available for enrolment." };
  if (course.price.pkr === 0) return { status: "error", message: "This course is free — no payment is needed." };

  const screenshot = formData.get("screenshot");
  if (!(screenshot instanceof File) || screenshot.size === 0) {
    return { status: "error", errors: { screenshot: "Please attach a screenshot of your payment receipt." }, values };
  }

  const provider = getPaymentProvider("manual");
  if (!provider) return { status: "error", message: "Manual payments are currently unavailable." };

  const supabase = await createClient();
  const result = await provider.createPayment(
    { supabase, userId: user.id, userEmail: user.email ?? "", course },
    {
      method: parsed.data.method,
      transactionId: parsed.data.transactionId,
      payerName: parsed.data.payerName,
      screenshot,
    },
  );
  if (!result.ok) return { status: "error", message: result.error, values };

  // Notify the learner and the site owner (failures are logged, not shown).
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const name = profile?.full_name || user.email || "Learner";
  const methodLabel = paymentConfig.methods.find((m) => m.id === parsed.data.method)?.label ?? parsed.data.method;
  await Promise.all([
    sendEmail({ to: user.email ?? "", ...paymentReceivedEmail({ name, courseTitle: course.title, amount: formatPkr(course.price.pkr) }) }),
    sendAdminEmail(
      adminNewPaymentEmail({
        name,
        email: user.email ?? "",
        courseTitle: course.title,
        method: methodLabel,
        transactionId: parsed.data.transactionId,
        amount: formatPkr(course.price.pkr),
      }),
    ),
  ]);

  revalidatePath(`/enroll/${course.slug}`);
  revalidatePath("/dashboard");
  redirect(`/enroll/${course.slug}?submitted=1`);
}

/** Free courses (price 0): enrol immediately. */
export async function enrollFree(formData: FormData) {
  const user = await getUser();
  const slug = String(formData.get("courseSlug") ?? "");
  if (!user) redirect(`/login?next=/enroll/${slug}`);

  const course = getCourse(slug);
  if (!course || !course.published || course.price.pkr !== 0 || !isAdminClientConfigured) redirect(`/courses/${slug}`);

  // Active enrolments can only be created by the server (secret key), never by the browser.
  const admin = createAdminClient();
  await admin
    .from("enrollments")
    .upsert(
      { user_id: user.id, course_slug: course.slug, status: "active", source: "free", approved_at: new Date().toISOString() },
      { onConflict: "user_id,course_slug" },
    );
  const first = getCourseLessons(course)[0];
  revalidatePath("/dashboard");
  redirect(first ? `/learn/${course.slug}/${first.slug}` : "/dashboard");
}
