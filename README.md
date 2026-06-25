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
- Google Maps API
- Venue marketplace APIs
- Email API (SendGrid/Resend)
- CRM
- Airtable / Database
- Stripe / Invoicing
- Calendar API

## License

MIT
