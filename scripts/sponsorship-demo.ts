#!/usr/bin/env tsx
/**
 * End-to-end sponsorship payment demo (mock mode — no PayPal credentials needed).
 *
 *   npm run paypal:demo
 *
 * Proves the full flow: intent → checkout link → approval checkpoint →
 * human approval → payment success → commitment marked paid → totals updated.
 */
import { createPaymentService } from "../src/payments/PaymentService.js";
import { SponsorshipAgent } from "../src/agents/sponsorship/SponsorshipAgent.js";
import { MOCK_SPONSOR_LEADS } from "../src/agents/sponsorship/mockSponsors.js";
import { formatMoney } from "../src/payments/types.js";

function divider(title: string): void {
  console.log("\n" + "=".repeat(70));
  console.log(`  ${title}`);
  console.log("=".repeat(70));
}

const EVENT = {
  eventId: "event_london_ai",
  eventName: "London AI Builders Hackathon",
  fundraisingGoal: 100000,
  currency: "GBP" as const,
};

async function main(): Promise<void> {
  console.log("\n💷 HackOS Sponsorship Payments Demo — PayPal (mock mode)\n");
  console.log(`Goal: Raise ${formatMoney(EVENT.fundraisingGoal, EVENT.currency)} for ${EVENT.eventName}`);

  // Force mock mode regardless of local env so the demo always runs.
  const service = createPaymentService({
    config: {
      mode: "mock",
      clientId: "",
      clientSecret: "",
      webhookId: "WH-DEMO",
      returnUrl: "http://localhost:3000/payments/paypal/success",
      cancelUrl: "http://localhost:3000/payments/paypal/cancel",
      apiBase: "",
    },
  });
  console.log(`PayPal mode: ${service.mode}`);

  const agent = new SponsorshipAgent({ mockMode: true, paymentService: service });

  divider("1. PLAN + CREATE SPONSORSHIP PAYMENTS");
  await agent.plan({ ...EVENT, leads: MOCK_SPONSOR_LEADS });
  const output = await agent.execute();
  console.log(`\nLeads processed: ${output.approvals.length}`);
  for (const a of output.approvals) {
    console.log(`\n  • ${a.sponsorName} — ${a.packageName} — ${formatMoney(a.amount, a.currency)}`);
    console.log(`    Payment intent: ${a.paymentIntentId}`);
    console.log(`    Checkout link:  ${a.checkoutUrl}`);
  }

  divider("2. HUMAN APPROVAL CHECKPOINT");
  const openai = output.approvals.find((a) => a.sponsorName === "OpenAI")!;
  console.log("\nApproval object returned to operator:");
  console.log(
    JSON.stringify(
      {
        action: openai.action,
        sponsorName: openai.sponsorName,
        amount: openai.amount,
        currency: openai.currency,
        packageName: openai.packageName,
        checkoutUrl: openai.checkoutUrl,
        approvalRequired: openai.approvalRequired,
        approvalStatus: openai.approvalStatus,
      },
      null,
      2,
    ),
  );
  console.log("\nDraft message to sponsor:");
  console.log("  " + openai.messageDraft.split("\n").join("\n  "));

  divider("3. OPERATOR APPROVES → LINK SENT");
  const sent = agent.approveAndSendPaymentLink(openai.approvalId);
  console.log(`\nApproved. Link sent to ${openai.sponsorName} (commitment → payment_link_sent).`);
  console.log(`Sent message preview: "${sent.message.split("\n")[0]}..."`);

  divider("4. SPONSOR PAYS (simulated PayPal success)");
  const receipt = await agent.simulatePaymentSuccess(openai.paymentIntentId);
  const paidIntent = service.getStore().getIntent(openai.paymentIntentId)!;
  console.log(`\nPayment status: ${paidIntent.status}`);
  console.log("Receipt message:");
  console.log("  " + receipt.message.split("\n").join("\n  "));

  divider("5. MAIN AGENT: WHAT SPONSORSHIP PAYMENTS ARE PENDING?");
  const summary = service.getSponsorshipPaymentsSummary(EVENT.eventId);
  console.log(JSON.stringify(summary, null, 2));

  divider("6. OPENAI SPONSORSHIP PIPELINE");
  const stages = [
    "Interested",
    "Meeting booked",
    `${formatMoney(openai.amount, openai.currency)} sponsor`,
    "Payment link sent",
    "Paid",
  ];
  const reached = service.getStore().getCommitmentByIntent(openai.paymentIntentId)!.status === "paid";
  console.log("\nOpenAI");
  stages.forEach((stage, i) => {
    const done = reached || i < stages.length - 1;
    console.log(`  ${done ? "✓" : "○"} ${stage}${i < stages.length - 1 ? "\n  ↓" : ""}`);
  });

  console.log("\n✅ Sponsorship payment flow complete. Run `npm test` for the full suite.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
