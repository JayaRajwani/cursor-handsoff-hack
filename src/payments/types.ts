/**
 * Payment domain models for HackOS.
 *
 * Amounts are expressed in MAJOR currency units (e.g. amount: 25000 === £25,000),
 * matching how sponsorship packages are quoted. Provider calls format these to the
 * two-decimal strings PayPal expects.
 */

export type PaymentProvider = "paypal";

export type PayerType = "sponsor" | "participant" | "vendor";

export type PaymentPurpose = "sponsorship" | "ticket" | "vendor_payout";

export type PaymentStatus =
  | "draft"
  | "pending"
  | "checkout_created"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type CommitmentStatus =
  | "interested"
  | "meeting_booked"
  | "verbally_committed"
  | "invoice_sent"
  | "payment_link_sent"
  | "paid"
  | "failed"
  | "cancelled";

/** Currencies HackOS supports for payments today. */
export const SUPPORTED_CURRENCIES = ["GBP", "USD", "EUR"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
};

export interface PaymentIntent {
  id: string;
  eventId: string;
  payerType: PayerType;
  payerId: string;
  payerName: string;
  purpose: PaymentPurpose;
  packageName: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerOrderId: string | null;
  checkoutUrl: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface CommitmentNote {
  timestamp: string;
  note: string;
}

export interface SponsorshipCommitment {
  id: string;
  eventId: string;
  sponsorId: string;
  sponsorName: string;
  contactName: string;
  contactEmail: string;
  packageName: string;
  amount: number;
  currency: Currency;
  status: CommitmentStatus;
  paymentIntentId: string | null;
  notes: CommitmentNote[];
}

export type PaymentEventStatus = "processed" | "ignored" | "failed";

/** A PayPal webhook event type relevant to checkout/capture. */
export type PayPalWebhookEventType =
  | "CHECKOUT.ORDER.APPROVED"
  | "PAYMENT.CAPTURE.COMPLETED"
  | "PAYMENT.CAPTURE.DENIED"
  | "CHECKOUT.ORDER.CANCELLED"
  | string;

export interface PaymentEvent {
  id: string;
  paymentIntentId: string | null;
  provider: PaymentProvider;
  providerEventId: string;
  eventType: PayPalWebhookEventType;
  rawPayload: Record<string, unknown>;
  processedAt: string;
  status: PaymentEventStatus;
}

/** Format an amount + currency for human-facing messages, e.g. "£25,000". */
export function formatMoney(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  return `${symbol}${amount.toLocaleString("en-GB")}`;
}

/** Format an amount as the two-decimal string the PayPal Orders API expects. */
export function toPayPalAmount(amount: number): string {
  return amount.toFixed(2);
}
