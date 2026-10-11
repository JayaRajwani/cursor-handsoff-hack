/**
 * PAYMENT PROVIDER INTERFACE
 * ----------------------------------------------------------------------
 * Every way of paying (manual bank transfer today; an online card/wallet
 * gateway later) implements this interface. The enrolment page and admin
 * panel only talk to this interface, so adding a new provider means adding
 * one new file — no rewrites elsewhere.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Course } from "@/lib/content/courses";

/** "manual" = learner pays outside the site and uploads proof; "redirect" = learner is sent to a gateway checkout page. */
export type PaymentFlow = "manual" | "redirect";

export type PaymentContext = {
  /** Supabase client acting as the logged-in learner (RLS applies). */
  supabase: SupabaseClient;
  userId: string;
  userEmail: string;
  course: Course;
};

export type ManualPaymentInput = {
  method: string;
  transactionId: string;
  payerName: string;
  /** Uploaded receipt screenshot */
  screenshot: File;
};

export type PaymentResult =
  | { ok: true; paymentId: string; enrollmentId: string; status: "pending" | "approved"; redirectUrl?: string }
  | { ok: false; error: string };

export interface PaymentProvider {
  /** Saved in payments.provider, e.g. "manual", "payfast", "stripe" */
  id: string;
  /** Shown to admins */
  name: string;
  flow: PaymentFlow;
  /** Is this provider configured and switched on? */
  isEnabled(): boolean;
  /**
   * Start a payment for a course.
   * - Manual providers record the submitted proof and return status "pending".
   * - Redirect providers create a checkout session and return `redirectUrl`.
   */
  createPayment(ctx: PaymentContext, input: ManualPaymentInput | Record<string, never>): Promise<PaymentResult>;
}
