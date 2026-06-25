import { loadPayPalConfig, type PayPalConfig } from "./config.js";
import {
  AmountMismatchError,
  CaptureError,
  CurrencyMismatchError,
  InvalidAmountError,
  PaymentAlreadyCapturedError,
  PaymentNotFoundError,
  UnsupportedCurrencyError,
  WebhookVerificationError,
} from "./errors.js";
import { genId } from "./ids.js";
import { LivePayPalClient, approvalLink, type PayPalClient, type WebhookHeaders } from "./PayPalClient.js";
import { MockPayPalClient } from "./MockPayPalClient.js";
import { InMemoryPaymentStore, type PaymentStore } from "./store.js";
import { paymentLinkMessage } from "./templates.js";
import {
  SUPPORTED_CURRENCIES,
  type CommitmentStatus,
  type Currency,
  type PayerType,
  type PaymentEvent,
  type PaymentIntent,
  type PaymentPurpose,
  type SponsorshipCommitment,
} from "./types.js";

export interface PaymentServiceOptions {
  config?: PayPalConfig;
  client?: PayPalClient;
  store?: PaymentStore;
}

export interface CreatePaymentIntentParams {
  eventId: string;
  payerType: PayerType;
  payerId: string;
  payerName: string;
  purpose: PaymentPurpose;
  packageName: string;
  amount: number;
  currency: Currency;
  metadata?: Record<string, unknown>;
}

export interface CreateSponsorshipPaymentParams {
  eventId: string;
  eventName?: string;
  sponsorId: string;
  sponsorName: string;
  contactName?: string;
  contactEmail: string;
  packageName: string;
  amount: number;
  currency: Currency;
}

export interface SponsorshipPaymentResult {
  paymentIntentId: string;
  checkoutUrl: string;
  status: PaymentIntent["status"];
  messageForSponsor: string;
}

export interface PendingPaymentSummary {
  pendingPayments: Array<{
    sponsorName: string;
    amount: number;
    currency: Currency;
    status: CommitmentStatus;
    checkoutUrl: string | null;
  }>;
  totalCommitted: number;
  totalPaid: number;
  totalPending: number;
}

const COMMITTED_STATUSES: CommitmentStatus[] = [
  "verbally_committed",
  "invoice_sent",
  "payment_link_sent",
  "paid",
];

interface WebhookBody {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    custom_id?: string;
    amount?: { value?: string; currency_code?: string };
    purchase_units?: Array<{ custom_id?: string; amount?: { value?: string; currency_code?: string } }>;
  };
}

/**
 * The single clean interface agents use to move money. Owns all business rules:
 * validation, status transitions, amount/currency checks, webhook idempotency,
 * and record-keeping. Provider specifics live behind PayPalClient.
 */
export class PaymentService {
  readonly config: PayPalConfig;
  private client: PayPalClient;
  private store: PaymentStore;

  constructor(options: PaymentServiceOptions = {}) {
    this.config = options.config ?? loadPayPalConfig();
    this.store = options.store ?? new InMemoryPaymentStore();
    this.client =
      options.client ?? (this.config.mode === "mock" ? new MockPayPalClient() : new LivePayPalClient(this.config));
  }

  get mode(): PayPalConfig["mode"] {
    return this.config.mode;
  }

  getStore(): PaymentStore {
    return this.store;
  }

  // ── Validation ──────────────────────────────────────────────────────────

  private validateAmount(amount: number): void {
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      throw new InvalidAmountError(amount);
    }
  }

  private validateCurrency(currency: string): asserts currency is Currency {
    if (!SUPPORTED_CURRENCIES.includes(currency as Currency)) {
      throw new UnsupportedCurrencyError(currency);
    }
  }

  // ── Intents & orders ──────────────────────────────────────────────────────

  createPaymentIntent(params: CreatePaymentIntentParams): PaymentIntent {
    this.validateAmount(params.amount);
    this.validateCurrency(params.currency);

    const now = new Date().toISOString();
    const intent: PaymentIntent = {
      id: genId("payment_intent"),
      eventId: params.eventId,
      payerType: params.payerType,
      payerId: params.payerId,
      payerName: params.payerName,
      purpose: params.purpose,
      packageName: params.packageName,
      amount: params.amount,
      currency: params.currency,
      status: "draft",
      provider: "paypal",
      providerOrderId: null,
      checkoutUrl: null,
      createdAt: now,
      updatedAt: now,
      metadata: params.metadata ?? {},
    };
    this.store.saveIntent(intent);
    this.log("intent_created", { paymentIntentId: intent.id, amount: intent.amount, currency: intent.currency });
    return intent;
  }

  /** Create the PayPal order for an intent and attach the checkout URL. */
  async createOrder(paymentIntentId: string): Promise<PaymentIntent> {
    const intent = this.requireIntent(paymentIntentId);
    const order = await this.client.createOrder({
      paymentIntentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      description: `${intent.packageName} — ${intent.payerName}`,
      returnUrl: this.config.returnUrl,
      cancelUrl: this.config.cancelUrl,
    });
    const checkoutUrl = approvalLink(order);
    return this.patchIntent(intent.id, {
      providerOrderId: order.id,
      checkoutUrl,
      status: "checkout_created",
    });
  }

  /** Ensure an order exists for the intent and return its checkout URL. */
  async createPaymentLink(paymentIntentId: string): Promise<string> {
    let intent = this.requireIntent(paymentIntentId);
    if (!intent.providerOrderId || !intent.checkoutUrl) {
      intent = await this.createOrder(paymentIntentId);
    }
    if (!intent.checkoutUrl) {
      throw new CaptureError("No checkout URL was returned by the provider");
    }
    return intent.checkoutUrl;
  }

  async getOrder(paymentIntentId: string): Promise<PaymentIntent> {
    const intent = this.requireIntent(paymentIntentId);
    if (intent.providerOrderId) {
      // Refresh provider status; ignore transient lookup failures in mock/dev.
      try {
        await this.client.getOrder(intent.providerOrderId);
      } catch {
        /* non-fatal: return last known intent state */
      }
    }
    return intent;
  }

  /** Capture an approved order, with amount/currency guards, and mark it paid. */
  async captureOrder(paymentIntentId: string): Promise<PaymentIntent> {
    const intent = this.requireIntent(paymentIntentId);
    if (intent.status === "paid") {
      throw new PaymentAlreadyCapturedError(paymentIntentId);
    }
    if (!intent.providerOrderId) {
      throw new CaptureError(`No PayPal order exists for ${paymentIntentId}`);
    }

    let captured;
    try {
      captured = await this.client.captureOrder(intent.providerOrderId);
    } catch (err) {
      this.markPaymentFailed(paymentIntentId, { reason: String(err) });
      throw err;
    }

    this.assertCapturedMatches(intent, captured.capturedAmount, captured.capturedCurrency);
    return this.markPaymentPaid(paymentIntentId, {
      capturedAmount: captured.capturedAmount,
      capturedCurrency: captured.capturedCurrency,
    });
  }

  /** Guard captured amount/currency against the intent before trusting a capture. */
  private assertCapturedMatches(intent: PaymentIntent, amount?: number, currency?: Currency): void {
    if (amount !== undefined && amount !== intent.amount) {
      throw new AmountMismatchError(intent.amount, amount);
    }
    if (currency !== undefined && currency !== intent.currency) {
      throw new CurrencyMismatchError(intent.currency, currency);
    }
  }

  // ── Status transitions ─────────────────────────────────────────────────────

  markPaymentPaid(paymentIntentId: string, meta: Record<string, unknown> = {}): PaymentIntent {
    const intent = this.patchIntent(paymentIntentId, { status: "paid" }, meta);
    this.syncCommitmentStatus(paymentIntentId, "paid");
    this.log("payment_paid", { paymentIntentId });
    return intent;
  }

  markPaymentFailed(paymentIntentId: string, meta: Record<string, unknown> = {}): PaymentIntent {
    const intent = this.patchIntent(paymentIntentId, { status: "failed" }, meta);
    this.syncCommitmentStatus(paymentIntentId, "failed");
    this.log("payment_failed", { paymentIntentId });
    return intent;
  }

  markPaymentPending(paymentIntentId: string, meta: Record<string, unknown> = {}): PaymentIntent {
    const intent = this.patchIntent(paymentIntentId, { status: "pending" }, meta);
    this.log("payment_pending", { paymentIntentId });
    return intent;
  }

  markPaymentCancelled(paymentIntentId: string, meta: Record<string, unknown> = {}): PaymentIntent {
    const intent = this.patchIntent(paymentIntentId, { status: "cancelled" }, meta);
    this.syncCommitmentStatus(paymentIntentId, "cancelled");
    this.log("payment_cancelled", { paymentIntentId });
    return intent;
  }

  // ── Webhooks ────────────────────────────────────────────────────────────────

  async verifyWebhookSignature(headers: WebhookHeaders, rawBody: string): Promise<boolean> {
    return this.client.verifyWebhookSignature(headers, rawBody);
  }

  /**
   * Verify, deduplicate, and apply a PayPal webhook event. Idempotent: a
   * provider event id seen before is recorded as "ignored" and causes no
   * further state change.
   */
  async handleWebhook(headers: WebhookHeaders, rawBody: string): Promise<PaymentEvent> {
    const verified = await this.verifyWebhookSignature(headers, rawBody);
    if (!verified) {
      throw new WebhookVerificationError();
    }

    const body = JSON.parse(rawBody) as WebhookBody;
    const providerEventId = body.id ?? genId("evt");
    const eventType = body.event_type ?? "UNKNOWN";
    const paymentIntentId = this.resolveIntentId(body);

    const payload = body as unknown as Record<string, unknown>;

    // Idempotency / duplicate protection.
    if (this.store.hasProcessedProviderEvent(providerEventId)) {
      return this.recordEvent(providerEventId, eventType, paymentIntentId, payload, "ignored");
    }

    let status: PaymentEvent["status"] = "processed";
    if (paymentIntentId && this.store.getIntent(paymentIntentId)) {
      switch (eventType) {
        case "CHECKOUT.ORDER.APPROVED":
          this.markPaymentPending(paymentIntentId, { via: "webhook" });
          break;
        case "PAYMENT.CAPTURE.COMPLETED": {
          const intent = this.requireIntent(paymentIntentId);
          const amt = body.resource?.amount?.value ?? body.resource?.purchase_units?.[0]?.amount?.value;
          const cur = body.resource?.amount?.currency_code ?? body.resource?.purchase_units?.[0]?.amount?.currency_code;
          this.assertCapturedMatches(
            intent,
            amt !== undefined ? Number(amt) : undefined,
            cur as Currency | undefined,
          );
          this.markPaymentPaid(paymentIntentId, { via: "webhook" });
          break;
        }
        case "PAYMENT.CAPTURE.DENIED":
          this.markPaymentFailed(paymentIntentId, { via: "webhook" });
          break;
        case "CHECKOUT.ORDER.CANCELLED":
          this.markPaymentCancelled(paymentIntentId, { via: "webhook" });
          break;
        default:
          status = "ignored";
      }
    } else {
      status = "ignored";
    }

    return this.recordEvent(providerEventId, eventType, paymentIntentId, payload, status);
  }

  private resolveIntentId(body: WebhookBody): string | null {
    const custom = body.resource?.custom_id ?? body.resource?.purchase_units?.[0]?.custom_id;
    if (custom && this.store.getIntent(custom)) return custom;
    // Fall back to matching by provider order id.
    const orderId = body.resource?.id;
    if (orderId) {
      const match = this.store.listIntents().find((i) => i.providerOrderId === orderId);
      if (match) return match.id;
    }
    return custom ?? null;
  }

  private recordEvent(
    providerEventId: string,
    eventType: string,
    paymentIntentId: string | null,
    rawPayload: Record<string, unknown>,
    status: PaymentEvent["status"],
  ): PaymentEvent {
    const event: PaymentEvent = {
      id: genId("payment_event"),
      paymentIntentId,
      provider: "paypal",
      providerEventId,
      eventType,
      rawPayload,
      processedAt: new Date().toISOString(),
      status,
    };
    this.store.saveEvent(event);
    this.log("webhook_handled", { providerEventId, eventType, status });
    return event;
  }

  // ── Sponsorship-specific surface for agents ─────────────────────────────────

  /** Register (or reuse) a sponsorship commitment and link it to an intent. */
  upsertCommitment(params: {
    eventId: string;
    sponsorId: string;
    sponsorName: string;
    contactName: string;
    contactEmail: string;
    packageName: string;
    amount: number;
    currency: Currency;
    status?: CommitmentStatus;
  }): SponsorshipCommitment {
    this.validateAmount(params.amount);
    this.validateCurrency(params.currency);

    const existing = this.store.listCommitments().find((c) => c.sponsorId === params.sponsorId);
    const commitment: SponsorshipCommitment = existing
      ? { ...existing, ...params, status: params.status ?? existing.status }
      : {
          id: genId("sponsorship"),
          eventId: params.eventId,
          sponsorId: params.sponsorId,
          sponsorName: params.sponsorName,
          contactName: params.contactName,
          contactEmail: params.contactEmail,
          packageName: params.packageName,
          amount: params.amount,
          currency: params.currency,
          status: params.status ?? "verbally_committed",
          paymentIntentId: null,
          notes: [],
        };
    this.store.saveCommitment(commitment);
    return commitment;
  }

  /**
   * Create a sponsorship payment: intent + PayPal order + checkout link, plus a
   * ready-to-send sponsor message. The message is a DRAFT — sending it is gated
   * behind human approval in the Sponsorship Agent.
   */
  async createSponsorshipPayment(params: CreateSponsorshipPaymentParams): Promise<SponsorshipPaymentResult> {
    this.validateAmount(params.amount);
    this.validateCurrency(params.currency);

    const contactName = params.contactName ?? deriveContactName(params.contactEmail, params.sponsorName);
    const commitment = this.upsertCommitment({
      eventId: params.eventId,
      sponsorId: params.sponsorId,
      sponsorName: params.sponsorName,
      contactName,
      contactEmail: params.contactEmail,
      packageName: params.packageName,
      amount: params.amount,
      currency: params.currency,
      status: "verbally_committed",
    });

    const intent = this.createPaymentIntent({
      eventId: params.eventId,
      payerType: "sponsor",
      payerId: params.sponsorId,
      payerName: params.sponsorName,
      purpose: "sponsorship",
      packageName: params.packageName,
      amount: params.amount,
      currency: params.currency,
      metadata: { commitmentId: commitment.id, contactEmail: params.contactEmail },
    });

    this.store.saveCommitment({ ...commitment, paymentIntentId: intent.id });

    const checkoutUrl = await this.createPaymentLink(intent.id);
    const updated = this.requireIntent(intent.id);

    const messageForSponsor = paymentLinkMessage({
      contactName,
      packageName: params.packageName,
      eventName: params.eventName ?? params.eventId,
      amount: params.amount,
      currency: params.currency,
      checkoutUrl,
    });

    return {
      paymentIntentId: intent.id,
      checkoutUrl,
      status: updated.status,
      messageForSponsor,
    };
  }

  /** Summary for the Main Agent: "what sponsorship payments are pending?" */
  getSponsorshipPaymentsSummary(eventId?: string): PendingPaymentSummary {
    const commitments = this.store
      .listCommitments()
      .filter((c) => (eventId ? c.eventId === eventId : true));

    let totalCommitted = 0;
    let totalPaid = 0;
    const pendingPayments: PendingPaymentSummary["pendingPayments"] = [];

    for (const c of commitments) {
      if (!COMMITTED_STATUSES.includes(c.status)) continue;
      totalCommitted += c.amount;
      if (c.status === "paid") {
        totalPaid += c.amount;
        continue;
      }
      const intent = c.paymentIntentId ? this.store.getIntent(c.paymentIntentId) : undefined;
      pendingPayments.push({
        sponsorName: c.sponsorName,
        amount: c.amount,
        currency: c.currency,
        status: c.status,
        checkoutUrl: intent?.checkoutUrl ?? null,
      });
    }

    return {
      pendingPayments,
      totalCommitted,
      totalPaid,
      totalPending: totalCommitted - totalPaid,
    };
  }

  /**
   * Operator-approved "send the payment link" action. Moves the linked
   * commitment to payment_link_sent and returns the sponsor message to send.
   * This is the only path that should follow a human approval checkpoint.
   */
  approveSendLink(paymentIntentId: string, eventName?: string): { commitment: SponsorshipCommitment; message: string } {
    const intent = this.requireIntent(paymentIntentId);
    const commitment = this.store.getCommitmentByIntent(paymentIntentId);
    if (!commitment) {
      throw new PaymentNotFoundError(`commitment for ${paymentIntentId}`);
    }
    if (!intent.checkoutUrl) {
      throw new CaptureError(`No checkout link exists for ${paymentIntentId}`);
    }
    const updated = this.setCommitmentStatus(
      commitment.id,
      "payment_link_sent",
      `Payment link approved and sent to ${commitment.sponsorName}`,
    );
    const message = paymentLinkMessage({
      contactName: commitment.contactName,
      packageName: intent.packageName,
      eventName: eventName ?? (intent.metadata.eventName as string) ?? intent.eventId,
      amount: intent.amount,
      currency: intent.currency,
      checkoutUrl: intent.checkoutUrl,
    });
    this.log("link_approved_sent", { paymentIntentId, sponsor: commitment.sponsorName });
    return { commitment: updated, message };
  }

  /** Move a commitment along the pipeline (e.g. to payment_link_sent after approval). */
  setCommitmentStatus(commitmentId: string, status: CommitmentStatus, note?: string): SponsorshipCommitment {
    const commitment = this.store.getCommitment(commitmentId);
    if (!commitment) throw new PaymentNotFoundError(commitmentId);
    const notes = note
      ? [...commitment.notes, { timestamp: new Date().toISOString(), note }]
      : commitment.notes;
    const updated = { ...commitment, status, notes };
    this.store.saveCommitment(updated);
    return updated;
  }

  // ── Mock-only simulation helpers ─────────────────────────────────────────────

  /**
   * Drive a payment to a terminal state without a real PayPal interaction.
   * Mock mode only — throws in sandbox/live so it can't be misused in prod.
   */
  async simulateMockPayment(
    paymentIntentId: string,
    outcome: "success" | "failed" | "cancelled" = "success",
  ): Promise<PaymentIntent> {
    if (this.config.mode !== "mock") {
      throw new CaptureError("simulateMockPayment is only available in mock mode");
    }
    const intent = this.requireIntent(paymentIntentId);
    switch (outcome) {
      case "success":
        return this.captureOrder(intent.id);
      case "failed":
        return this.markPaymentFailed(intent.id, { simulated: true });
      case "cancelled":
        return this.markPaymentCancelled(intent.id, { simulated: true });
    }
  }

  /** Build a signed-looking mock webhook payload for the given intent + type. */
  buildMockWebhook(
    paymentIntentId: string,
    eventType: string,
  ): { headers: WebhookHeaders; rawBody: string } {
    const intent = this.requireIntent(paymentIntentId);
    const body = {
      id: genId("WH"),
      event_type: eventType,
      resource: {
        id: intent.providerOrderId,
        custom_id: intent.id,
        amount: { value: intent.amount.toFixed(2), currency_code: intent.currency },
      },
    };
    return {
      headers: {
        "paypal-transmission-id": genId("txn"),
        "paypal-transmission-time": new Date().toISOString(),
        "paypal-auth-algo": "SHA256withRSA",
      },
      rawBody: JSON.stringify(body),
    };
  }

  // ── Internals ───────────────────────────────────────────────────────────────

  private requireIntent(paymentIntentId: string): PaymentIntent {
    const intent = this.store.getIntent(paymentIntentId);
    if (!intent) throw new PaymentNotFoundError(paymentIntentId);
    return intent;
  }

  private patchIntent(
    paymentIntentId: string,
    patch: Partial<PaymentIntent>,
    metaMerge: Record<string, unknown> = {},
  ): PaymentIntent {
    const intent = this.requireIntent(paymentIntentId);
    const updated: PaymentIntent = {
      ...intent,
      ...patch,
      metadata: { ...intent.metadata, ...metaMerge },
      updatedAt: new Date().toISOString(),
    };
    this.store.saveIntent(updated);
    return updated;
  }

  private syncCommitmentStatus(paymentIntentId: string, status: CommitmentStatus): void {
    const commitment = this.store.getCommitmentByIntent(paymentIntentId);
    if (commitment) {
      this.store.saveCommitment({ ...commitment, status });
    }
  }

  private log(action: string, details: Record<string, unknown>): void {
    // Structured, credential-free logging. Never logs client secret/tokens.
    if (process.env.PAYPAL_LOG === "1") {
      console.log(`[paypal] ${action}`, JSON.stringify(details));
    }
  }
}

function deriveContactName(email: string, fallback: string): string {
  const local = email.split("@")[0] ?? "";
  if (!local) return fallback;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function createPaymentService(options?: PaymentServiceOptions): PaymentService {
  return new PaymentService(options);
}
