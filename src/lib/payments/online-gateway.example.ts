/**
 * ======================================================================
 *  PLACEHOLDER: ONLINE PAYMENT GATEWAY (Phase 2 of payments — not active)
 * ======================================================================
 * When you are ready to accept cards/wallets online (for example through a
 * Pakistani gateway such as PayFast, Safepay, or JazzCash/Easypaisa merchant
 * APIs, or Stripe/Paddle for international buyers), implement it here:
 *
 * 1. Rename this file to e.g. `payfast.ts` and fill in createPayment():
 *      - create a checkout session with the gateway's API (server-side, secret key)
 *      - insert a `payments` row with provider = "payfast", status = "pending"
 *      - return { ok: true, status: "pending", redirectUrl: <checkout URL>, ... }
 *
 * 2. Add a webhook Route Handler, e.g. src/app/api/payments/payfast/webhook/route.ts:
 *      - VERIFY THE WEBHOOK SIGNATURE (never trust unsigned requests)
 *      - on success: set payments.status = "approved" and the enrolment
 *        status = "active" using the admin client, then send the
 *        enrolmentApprovedEmail — exactly like approvePayment() in
 *        src/lib/actions/admin.ts does for manual payments.
 *
 * 3. Register the provider in src/lib/payments/index.ts and add its secret
 *    keys to .env.example and your Vercel environment variables.
 *
 * Nothing else (database, admin panel, dashboard) needs to change.
 */
import type { PaymentProvider } from "./types";

export const onlineGatewayProvider: PaymentProvider = {
  id: "online-gateway",
  name: "Online gateway (not configured)",
  flow: "redirect",

  isEnabled() {
    // e.g. return Boolean(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_SECRET);
    return false;
  },

  async createPayment() {
    return { ok: false, error: "Online payments are not available yet." };
  },
};
