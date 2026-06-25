# HackOS

HackOS is an AI event company — not a dashboard. It autonomously plans, executes, and manages hackathons through a multi-agent system where each agent owns a real operational function.

## Quick Start

```bash
npm install
npm run demo         # Run Venue + Community agents on mock London AI hackathon
npm run paypal:demo  # End-to-end sponsorship payment flow (mock PayPal, no creds)
npm run paypal:serve # Payment API + operator approval view (mock by default)
npm test             # Run test suite
npm run build        # Compile TypeScript
```

## Architecture

```
src/
├── agents/
│   ├── base/           # BaseAgent abstract class + shared types
│   ├── venue/          # Venue search, scoring, risk, outreach
│   └── community/      # Discord server plan, roles, moderation
│   └── sponsorship/    # Sponsorship pipeline + PayPal payment collection
├── payments/           # PayPal integration (service, clients, store, templates)
├── api/                # Payment HTTP routes + operator approval view
├── orchestration/      # MainAgentOrchestrator
├── data/               # Mock event brief
└── integrations/       # Future API integration stubs
```

## Agents

### Venue Agent
Finds, compares, and recommends venues with explainable scoring across 11 dimensions, risk analysis, outreach email drafts, and human approval checkpoints before contacting venues.

### Community Agent
Creates Discord server structure (30+ channels), 12 roles with permission logic, welcome flows, rules, 12 announcement templates, bot automation design, moderation workflow, and community health tracking.

Runs a **WhatsApp** community alongside Discord: 12 groups (announcement, discussion, support, per-track, and role-gated private) mirrored to their Discord channels, plus WhatsApp Business broadcast templates derived from the announcement lifecycle. WhatsApp broadcasts reach personal phones, so they sit behind a dedicated high-risk approval checkpoint and an opt-in policy (UTILITY vs MARKETING templates). Toggle with `whatsappEnabled` in the event brief; credentials live in `.env.local` (`WHATSAPP_*`, mock mode by default).

### Sponsorship Agent
Runs the sponsorship money pipeline (interested → meeting booked → verbally committed → payment link sent → paid) and collects payments through **PayPal**. Generates payment intents and PayPal Checkout orders, but never sends a sponsor a payment link without a human approval checkpoint. After payment it marks the commitment paid and produces a receipt message.

## Payments (PayPal)

A production-shaped PayPal Checkout Orders integration with a clean mock mode.

- **`PaymentService`** is the single interface agents use: `createSponsorshipPayment`, `createOrder`, `captureOrder`, `getOrder`, `createPaymentLink`, `handleWebhook`, `verifyWebhookSignature`, `markPayment{Paid,Failed,Pending,Cancelled}`, `approveSendLink`, and `getSponsorshipPaymentsSummary`.
- **Three modes** via `PAYPAL_MODE`: `mock` (default when credentials are absent, no network), `sandbox`, and `live`. Set credentials in `.env.local` — run `npm run setup:paypal` to generate it. See [docs/paypal-sandbox.md](docs/paypal-sandbox.md).
- **Security**: server-side order creation only, webhook signature verification, idempotent/duplicate-event protection, amount + currency guards before capture, no client-side secrets, typed error responses.
- **Data models**: `PaymentIntent`, `SponsorshipCommitment`, `PaymentEvent`.
- **API routes** (`src/api`): `POST /api/payments/paypal/create-order`, `POST /api/payments/paypal/capture-order`, `GET /api/payments/:paymentIntentId`, `POST /api/webhooks/paypal`, `POST /api/payments/:paymentIntentId/approve-send-link`, plus an operator approval view at `GET /payments/approve/:paymentIntentId`.
- Architecture supports participant ticket and vendor payments via the same `PayerType`/`PaymentPurpose` models.

```typescript
const result = await orchestrator.paymentService.createSponsorshipPayment({
  eventId, sponsorId, sponsorName, contactEmail, packageName, amount, currency,
});
// → { paymentIntentId, checkoutUrl, status, messageForSponsor }

orchestrator.askPendingSponsorshipPayments(eventId);
// → { pendingPayments, totalCommitted, totalPaid, totalPending }
```

## Orchestration

```typescript
import { createOrchestrator, mockEventBrief } from "hackos";

const orchestrator = createOrchestrator({ mockMode: true });

await orchestrator.venueAgent.plan(mockEventBrief);
const venueResult = await orchestrator.venueAgent.execute();

await orchestrator.communityAgent.plan(mockEventBrief);
const communityResult = await orchestrator.communityAgent.execute();
```

## Future Integrations

Mock mode is enabled by default. Production integrations planned for:
- Discord API
- WhatsApp Business Cloud API (Meta Graph API / Twilio / 360dialog)
- Google Maps API
- Venue marketplace APIs
- Email API (SendGrid/Resend)
- CRM
- Airtable / Database
- Stripe / Invoicing
- Calendar API

## License

MIT
