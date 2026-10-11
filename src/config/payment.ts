/**
 * ============================================================
 *  PAYMENT CONFIGURATION — edit your payment details here
 * ============================================================
 * These details are shown to learners on the enrolment page.
 * REPLACE ALL PLACEHOLDER VALUES BEFORE LAUNCH.
 */

export type ManualPaymentMethod = {
  /** Internal id, saved with each payment. Do not change after launch. */
  id: "bank_transfer" | "jazzcash" | "easypaisa";
  /** Name shown to learners. */
  label: string;
  /** Lines of details shown to learners (account name, number, etc.). */
  details: { label: string; value: string }[];
  /** Optional extra instruction. */
  note?: string;
};

export const paymentConfig = {
  /** Currency used for all prices. */
  currency: "PKR",

  /**
   * Optional approximate USD display next to PKR prices.
   * Set `showUsd` to false to hide it. Update the rate occasionally.
   */
  showUsd: true,
  pkrPerUsd: 280,

  /** Manual payment methods offered in Phase 1. */
  methods: [
    {
      id: "bank_transfer",
      label: "Bank transfer",
      details: [
        { label: "Bank", value: "Your Bank Name (REPLACE)" },
        { label: "Account title", value: "MedAI Academy (REPLACE)" },
        { label: "Account number", value: "0000 0000 0000 0000 (REPLACE)" },
        { label: "IBAN", value: "PK00XXXX0000000000000000 (REPLACE)" },
      ],
      note: "Use your email address as the payment reference if your bank allows it.",
    },
    {
      id: "jazzcash",
      label: "JazzCash",
      details: [
        { label: "Account title", value: "Your Name (REPLACE)" },
        { label: "Mobile number", value: "0300 0000000 (REPLACE)" },
      ],
    },
    {
      id: "easypaisa",
      label: "Easypaisa",
      details: [
        { label: "Account title", value: "Your Name (REPLACE)" },
        { label: "Mobile number", value: "0345 0000000 (REPLACE)" },
      ],
    },
  ] satisfies ManualPaymentMethod[],

  /** Shown on the enrolment page after the payment details. */
  reviewTimeMessage:
    "We usually verify payments within 24 hours on working days. You will receive an email as soon as your access is activated.",

  /** Maximum screenshot size in megabytes (keep ≤ 4 on Vercel's free plan). */
  maxScreenshotMb: 4,
} as const;

/** Format a PKR amount, e.g. 4999 → "PKR 4,999". */
export function formatPkr(amount: number): string {
  if (amount === 0) return "Free";
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

/**
 * USD display next to the PKR price, e.g. "≈ US$18".
 * Uses the course's fixed USD price if set, otherwise converts with `pkrPerUsd`.
 * Returns null if USD display is turned off or the course is free.
 */
export function formatUsdApprox(amountPkr: number, fixedUsd?: number): string | null {
  if (!paymentConfig.showUsd || amountPkr === 0) return null;
  const usd = fixedUsd ?? Math.round(amountPkr / paymentConfig.pkrPerUsd);
  return `≈ US$${usd}`;
}
