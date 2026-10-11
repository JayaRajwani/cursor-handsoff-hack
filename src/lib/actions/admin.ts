"use server";

/**
 * Admin-only actions. Every action re-checks that the caller is an admin,
 * and the database's Row Level Security checks it again.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getAdminOrNull } from "@/lib/auth";
import { getCourse } from "@/lib/content/courses";
import { sendEmail } from "@/lib/email/send";
import { enrollmentApprovedEmail, enrollmentRejectedEmail } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/server";
import type { Payment } from "@/lib/types";
import { manualEnrollSchema, reviewPaymentSchema } from "@/lib/validation";

function back(path: string, params: Record<string, string>): never {
  redirect(`${path}?${new URLSearchParams(params).toString()}`);
}

/** Give a user active access to a course (insert or update their enrolment). */
async function activateEnrollment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  courseSlug: string,
  source: "payment" | "admin",
) {
  const now = new Date().toISOString();
  const { data: existing } = await supabase.from("enrollments").select("id").eq("user_id", userId).eq("course_slug", courseSlug).maybeSingle();
  if (existing) {
    return supabase.from("enrollments").update({ status: "active", approved_at: now, source }).eq("id", existing.id);
  }
  return supabase.from("enrollments").insert({ user_id: userId, course_slug: courseSlug, status: "active", source, approved_at: now });
}

export async function reviewPayment(formData: FormData) {
  const admin = await getAdminOrNull();
  if (!admin) redirect("/login?next=/admin/enrollments");

  const parsed = reviewPaymentSchema.safeParse({
    paymentId: formData.get("paymentId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) back("/admin/enrollments", { error: "Invalid request." });
  const { paymentId, decision, note } = parsed.data;

  const supabase = await createClient();
  const { data: paymentRow } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();
  const payment = paymentRow as Payment | null;
  if (!payment) back("/admin/enrollments", { error: "Payment not found." });
  if (payment.status !== "pending") back("/admin/enrollments", { error: "This payment has already been reviewed." });

  const { error: updateError } = await supabase
    .from("payments")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      admin_note: note || null,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", paymentId);
  if (updateError) back("/admin/enrollments", { error: `Could not update payment: ${updateError.message}` });

  const course = getCourse(payment.course_slug);
  const { data: learner } = await supabase.from("profiles").select("email, full_name").eq("id", payment.user_id).maybeSingle();
  const name = learner?.full_name || learner?.email || "Learner";

  if (decision === "approve") {
    const { error } = await activateEnrollment(supabase, payment.user_id, payment.course_slug, "payment");
    if (error) back("/admin/enrollments", { error: `Payment approved, but enrolment failed: ${error.message}` });
    if (learner?.email && course) {
      await sendEmail({ to: learner.email, ...enrollmentApprovedEmail({ name, courseTitle: course.title, courseSlug: course.slug }) });
    }
  } else {
    // Only mark the enrolment rejected if it isn't already active (e.g. from an earlier payment).
    await supabase
      .from("enrollments")
      .update({ status: "rejected" })
      .eq("user_id", payment.user_id)
      .eq("course_slug", payment.course_slug)
      .eq("status", "pending");
    if (learner?.email && course) {
      await sendEmail({
        to: learner.email,
        ...enrollmentRejectedEmail({ name, courseTitle: course.title, courseSlug: course.slug, note: note || undefined }),
      });
    }
  }

  revalidatePath("/admin", "layout");
  back("/admin/enrollments", { notice: decision === "approve" ? `Approved — ${name} now has access.` : `Rejected payment from ${name}.` });
}

export async function manualEnroll(formData: FormData) {
  const admin = await getAdminOrNull();
  if (!admin) redirect("/login?next=/admin/enrollments");

  const parsed = manualEnrollSchema.safeParse({ email: formData.get("email"), courseSlug: formData.get("courseSlug") });
  if (!parsed.success) back("/admin/enrollments", { error: parsed.error.issues[0]?.message ?? "Invalid input." });

  const course = getCourse(parsed.data.courseSlug);
  if (!course) back("/admin/enrollments", { error: "Course not found." });

  const supabase = await createClient();
  const { data: learner } = await supabase.from("profiles").select("id, email, full_name").eq("email", parsed.data.email).maybeSingle();
  if (!learner) back("/admin/enrollments", { error: `No account found for ${parsed.data.email}. Ask them to sign up first.` });

  const { error } = await activateEnrollment(supabase, learner.id, course.slug, "admin");
  if (error) back("/admin/enrollments", { error: `Could not enrol: ${error.message}` });

  if (formData.get("notify") === "on") {
    await sendEmail({
      to: learner.email,
      ...enrollmentApprovedEmail({ name: learner.full_name || learner.email, courseTitle: course.title, courseSlug: course.slug }),
    });
  }
  revalidatePath("/admin", "layout");
  back("/admin/enrollments", { notice: `${learner.email} is now enrolled in ${course.title}.` });
}

export async function revokeEnrollment(formData: FormData) {
  const admin = await getAdminOrNull();
  if (!admin) redirect("/login?next=/admin/enrollments");
  const id = String(formData.get("enrollmentId") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").update({ status: "rejected" }).eq("id", id);
  revalidatePath("/admin", "layout");
  back("/admin/enrollments", error ? { error: error.message } : { notice: "Access removed." });
}

/** Mark a contact message or institution enquiry as handled / not handled. */
export async function toggleHandled(formData: FormData) {
  const admin = await getAdminOrNull();
  if (!admin) redirect("/login?next=/admin");
  const table = formData.get("table") === "institution_enquiries" ? "institution_enquiries" : "contact_messages";
  const id = String(formData.get("id") ?? "");
  const handled = formData.get("handled") === "true";
  const supabase = await createClient();
  await supabase.from(table).update({ handled }).eq("id", id);
  const path = table === "contact_messages" ? "/admin/messages" : "/admin/enquiries";
  revalidatePath(path);
  redirect(path);
}
