import { describe, it, expect, beforeEach } from "vitest";
import { PaymentService } from "../src/payments/PaymentService.js";
import { MockPayPalClient } from "../src/payments/MockPayPalClient.js";
import { InMemoryPaymentStore } from "../src/payments/store.js";
import {
  AmountMismatchError,
  CaptureError,
  CurrencyMismatchError,
  PaymentAlreadyCapturedError,
  WebhookVerificationError,
} from "../src/payments/errors.js";
import type { PayPalConfig } from "../src/payments/config.js";
import { SponsorshipAgent } from "../src/agents/sponsorship/SponsorshipAgent.js";
import { MOCK_SPONSOR_LEADS } from "../src/agents/sponsorship/mockSponsors.js";

const MOCK_CONFIG: PayPalConfig = {
  mode: "mock",
  clientId: "",
  clientSecret: "",
  webhookId: "WH-TEST",
  returnUrl: "http://localhost:3000/payments/paypal/success",
  cancelUrl: "http://localhost:3000/payments/paypal/cancel",
  apiBase: "",
};

function makeService(client = new MockPayPalClient()): PaymentService {
  return new PaymentService({ config: MOCK_CONFIG, client, store: new InMemoryPaymentStore() });
}

const SPONSOR = {
  eventId: "event_london_ai",
  eventName: "London AI Builders Hackathon",
  sponsorId: "sponsor_openai",
  sponsorName: "OpenAI",
  contactName: "Jane Smith",
  contactEmail: "jane@openai.com",
  packageName: "Gold Sponsor",
  amount: 25000,
  currency: "GBP" as const,
};

describe("sponsorship payment intent", () => {
  it("1. creates a sponsorship payment intent", () => {
    const service = makeService();
    const intent = service.createPaymentIntent({
      eventId: SPONSOR.eventId,
      payerType: "sponsor",
      payerId: SPONSOR.sponsorId,
      payerName: SPONSOR.sponsorName,
      purpose: "sponsorship",
      packageName: SPONSOR.packageName,
      amount: SPONSOR.amount,
      currency: SPONSOR.currency,
    });
    expect(intent.id).toMatch(/^payment_intent_/);
    expect(intent.status).toBe("draft");
    expect(intent.amount).toBe(25000);
    expect(intent.provider).toBe("paypal");
  });
});

describe("PayPal order + checkout url", () => {
  it("2 & 3. creates a PayPal order and generates a checkout URL", async () => {
    const service = makeService();
    const result = await service.createSponsorshipPayment(SPONSOR);
    expect(result.status).toBe("checkout_created");
    expect(result.checkoutUrl).toContain("/mock-paypal/checkout/");
    expect(result.checkoutUrl).toContain(result.paymentIntentId);

    const intent = service.getStore().getIntent(result.paymentIntentId)!;
    expect(intent.providerOrderId).toMatch(/^MOCK-ORDER-/);
    expect(result.messageForSponsor).toContain("£25,000");
    expect(result.messageForSponsor).toContain(SPONSOR.eventName);
  });
});

describe("mock payment outcomes", () => {
  it("4. simulates a successful mock payment and marks it paid", async () => {
    const service = makeService();
    const { paymentIntentId } = await service.createSponsorshipPayment(SPONSOR);
    const intent = await service.simulateMockPayment(paymentIntentId, "success");
    expect(intent.status).toBe("paid");
  });

  it("5. simulates a failed mock payment", async () => {
    const service = makeService(new MockPayPalClient({ failCapture: true }));
    const { paymentIntentId } = await service.createSponsorshipPayment(SPONSOR);
    await expect(service.simulateMockPayment(paymentIntentId, "success")).rejects.toBeInstanceOf(CaptureError);
    expect(service.getStore().getIntent(paymentIntentId)!.status).toBe("failed");
  });
});

describe("webhooks", () => {
  it("6. rejects a webhook with an invalid signature", async () => {
    const service = makeService();
    const { paymentIntentId } = await service.createSponsorshipPayment(SPONSOR);
    const { rawBody } = service.buildMockWebhook(paymentIntentId, "PAYMENT.CAPTURE.COMPLETED");
    await expect(
      service.handleWebhook({ "paypal-mock-signature": "invalid" }, rawBody),
    ).rejects.toBeInstanceOf(WebhookVerificationError);
  });

  it("7. ignores a duplicate webhook event", async () => {
    const service = makeService();
    const { paymentIntentId } = await service.createSponsorshipPayment(SPONSOR);
    const { headers, rawBody } = service.buildMockWebhook(paymentIntentId, "PAYMENT.CAPTURE.COMPLETED");

    const first = await service.handleWebhook(headers, rawBody);
    const second = await service.handleWebhook(headers, rawBody);
    expect(first.status).toBe("processed");
    expect(second.status).toBe("ignored");
  });

  it("8. marks payment paid after a capture-completed webhook", async () => {
    const service = makeService();
    const { paymentIntentId } = await service.createSponsorshipPayment(SPONSOR);
    const { headers, rawBody } = service.buildMockWebhook(paymentIntentId, "PAYMENT.CAPTURE.COMPLETED");
    await service.handleWebhook(headers, rawBody);
    expect(service.getStore().getIntent(paymentIntentId)!.status).toBe("paid");
  });
});

describe("commitment lifecycle", () => {
  it("9. updates the sponsorship commitment after payment", async () => {
    const service = makeService();
    const { paymentIntentId } = await service.createSponsorshipPayment(SPONSOR);
    await service.simulateMockPayment(paymentIntentId, "success");
    const commitment = service.getStore().getCommitmentByIntent(paymentIntentId)!;
    expect(commitment.status).toBe("paid");
  });
});

describe("human approval checkpoint", () => {
  it("10. requires approval before the payment link is sent", async () => {
    const service = makeService();
    const agent = new SponsorshipAgent({ mockMode: true, paymentService: service });
    await agent.plan({
      eventId: SPONSOR.eventId,
      eventName: SPONSOR.eventName,
      fundraisingGoal: 100000,
      currency: "GBP",
      leads: MOCK_SPONSOR_LEADS,
    });
    const output = await agent.execute();

    expect(output.status).toBe("pending_approval");
    expect(output.approvalRequired).toBe(true);
    expect(output.approvals[0]!.approvalStatus).toBe("pending");

    // Commitment must NOT be marked sent until approved.
    const before = agent.getCommitment("sponsor_openai")!;
    expect(before.status).toBe("verbally_committed");

    const approvalId = output.approvals.find((a) => a.sponsorName === "OpenAI")!.approvalId;
    const sent = agent.approveAndSendPaymentLink(approvalId);
    expect(sent.sent).toBe(true);

    const after = agent.getCommitment("sponsor_openai")!;
    expect(after.status).toBe("payment_link_sent");
  });
});

describe("capture guards", () => {
  it("11. rejects a captured amount that does not match the intent", async () => {
    const service = makeService(new MockPayPalClient({ captureAmountOverride: 9999 }));
    const { paymentIntentId } = await service.createSponsorshipPayment(SPONSOR);
    await expect(service.captureOrder(paymentIntentId)).rejects.toBeInstanceOf(AmountMismatchError);
  });

  it("12. rejects a captured currency that does not match the intent", async () => {
    const service = makeService(new MockPayPalClient({ captureCurrencyOverride: "USD" }));
    const { paymentIntentId } = await service.createSponsorshipPayment(SPONSOR);
    await expect(service.captureOrder(paymentIntentId)).rejects.toBeInstanceOf(CurrencyMismatchError);
  });

  it("rejects double capture of an already-paid payment", async () => {
    const service = makeService();
    const { paymentIntentId } = await service.createSponsorshipPayment(SPONSOR);
    await service.captureOrder(paymentIntentId);
    await expect(service.captureOrder(paymentIntentId)).rejects.toBeInstanceOf(PaymentAlreadyCapturedError);
  });
});

describe("main agent money question", () => {
  it("summarises committed / paid / pending totals", async () => {
    const service = makeService();
    const agent = new SponsorshipAgent({ mockMode: true, paymentService: service });
    await agent.plan({
      eventId: SPONSOR.eventId,
      eventName: SPONSOR.eventName,
      fundraisingGoal: 100000,
      currency: "GBP",
      leads: MOCK_SPONSOR_LEADS,
    });
    const output = await agent.execute();

    // OpenAI £25k pays; Replit £5k stays pending.
    const openai = output.approvals.find((a) => a.sponsorName === "OpenAI")!;
    agent.approveAndSendPaymentLink(openai.approvalId);
    await agent.simulatePaymentSuccess(openai.paymentIntentId);

    const summary = service.getSponsorshipPaymentsSummary(SPONSOR.eventId);
    expect(summary.totalCommitted).toBe(30000);
    expect(summary.totalPaid).toBe(25000);
    expect(summary.totalPending).toBe(5000);
    expect(summary.pendingPayments.some((p) => p.sponsorName === "Replit")).toBe(true);
  });
});
