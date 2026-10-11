/**
 * MANUAL PAYMENT PROVIDER (Phase 1)
 * Learner pays by bank transfer / JazzCash / Easypaisa, then uploads a
 * screenshot and transaction ID. An admin approves it in /admin/enrollments.
 */
import "server-only";

import { paymentConfig } from "@/config/payment";
import type { ManualPaymentInput, PaymentContext, PaymentProvider, PaymentResult } from "./types";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export const manualProvider: PaymentProvider = {
  id: "manual",
  name: "Manual (bank transfer / mobile wallet)",
  flow: "manual",

  isEnabled() {
    return true;
  },

  async createPayment(ctx: PaymentContext, rawInput): Promise<PaymentResult> {
    const input = rawInput as ManualPaymentInput;
    const { supabase, userId, course } = ctx;

    if (!paymentConfig.methods.some((m) => m.id === input.method)) {
      return { ok: false, error: "Please choose a valid payment method." };
    }

    // 1) Check the screenshot
    const file = input.screenshot;
    if (!file || file.size === 0) return { ok: false, error: "Please attach a screenshot of your payment receipt." };
    if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, error: "The receipt must be a JPG, PNG, WEBP or PDF file." };
    if (file.size > paymentConfig.maxScreenshotMb * 1024 * 1024) {
      return { ok: false, error: `The file is too large. Maximum size is ${paymentConfig.maxScreenshotMb} MB.` };
    }

    // 2) Upload it to the private bucket, inside the learner's own folder
    const path = `${userId}/${course.slug}-${Date.now()}.${EXTENSIONS[file.type]}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      console.error("[payments] upload failed:", uploadError.message);
      return { ok: false, error: "We could not upload your receipt. Please try again." };
    }

    // 3) Create (or re-open) the enrolment as "pending"
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("user_id", userId)
      .eq("course_slug", course.slug)
      .maybeSingle();

    let enrollmentId: string;
    if (!existing) {
      const { data, error } = await supabase
        .from("enrollments")
        .insert({ user_id: userId, course_slug: course.slug, status: "pending", source: "payment" })
        .select("id")
        .single();
      if (error || !data) {
        console.error("[payments] enrolment insert failed:", error?.message);
        return { ok: false, error: "We could not create your enrolment. Please try again." };
      }
      enrollmentId = data.id;
    } else if (existing.status === "rejected") {
      const { error } = await supabase.from("enrollments").update({ status: "pending", source: "payment" }).eq("id", existing.id);
      if (error) return { ok: false, error: "We could not update your enrolment. Please try again." };
      enrollmentId = existing.id;
    } else if (existing.status === "pending") {
      // Allow sending a corrected payment while the first is still pending.
      enrollmentId = existing.id;
    } else {
      return { ok: false, error: "You are already enrolled in this course." };
    }

    // 4) Record the payment for admin review
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        enrollment_id: enrollmentId,
        course_slug: course.slug,
        provider: "manual",
        method: input.method,
        amount_pkr: course.price.pkr,
        transaction_id: input.transactionId,
        payer_name: input.payerName,
        screenshot_path: path,
        status: "pending",
      })
      .select("id")
      .single();
    if (paymentError || !payment) {
      console.error("[payments] payment insert failed:", paymentError?.message);
      return { ok: false, error: "We could not save your payment details. Please try again." };
    }

    return { ok: true, paymentId: payment.id, enrollmentId, status: "pending" };
  },
};
