# HackOS

HackOS is an AI event company — not a dashboard. It autonomously plans, executes, and manages hackathons through a multi-agent system where each agent owns a real operational function.

## Quick Start

```bash
npm install
npm run demo    # Run Venue + Community agents on mock London AI hackathon
npm test        # Run test suite
npm run build   # Compile TypeScript
```

## Architecture

```
src/
├── agents/
│   ├── base/           # BaseAgent abstract class + shared types
│   ├── venue/          # Venue search, scoring, risk, outreach
│   └── community/      # Discord server plan, roles, moderation
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
