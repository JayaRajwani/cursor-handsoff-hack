# HackOS

HackOS is an AI-powered event company operating system for autonomous hackathon management. It plans, executes, and manages hackathons through a multi-agent system where sibling agents own real operational functions.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run demo     # Run Venue + Community agents on mock London AI hackathon
npm test         # Run test suite
npm run build    # Compile the backend TypeScript
```

## API

### `POST /api/run-hackos`

Request:

```json
{
  "goal": "Run an AI hackathon for climate-tech founders in London"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "goal": "...",
    "organizer": {},
    "sponsorship": {},
    "persistence": {
      "saved": true,
      "runId": "..."
    },
    "metadata": {
      "agentSources": {
        "organizer": "openai",
        "sponsorship": "openai"
      },
      "agentErrors": {},
      "createdAt": "2026-06-25T18:00:00.000Z"
    }
  }
}
```

If OpenAI is unavailable or `OPENAI_API_KEY` is missing, the backend returns structured mock agent outputs. If Supabase is unavailable or not configured, the backend still returns the generated data with `persistence.saved: false`.

## Environment

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Create the Supabase table by running `supabase/schema.sql` in the Supabase SQL editor or via the Supabase CLI.

## Architecture

```text
api/
  run-hackos.ts                  # Vercel serverless entrypoint
app/
  api/run-hackos/route.ts        # Framework-neutral Request/Response handler
lib/
  orchestrator.ts                # Coordinates Main Organizer + Sponsorship agents
  agents/
    organizerAgent.ts            # Event concept, tracks, website copy, flows, judging, checklist
    sponsorshipAgent.ts          # Packages, discovery, outreach, pipeline, values, negotiation
  supabase.ts                    # Persistence with graceful failure
src/
  agents/
    base/                        # BaseAgent abstract class + shared types
    venue/                       # Venue search, scoring, risk, outreach
    community/                   # Discord server plan, roles, moderation
  orchestration/                 # Existing MainAgentOrchestrator
  data/                          # Mock event brief
  integrations/                  # Future API integration stubs
supabase/
  schema.sql                     # hackos_runs table
```

The HackOS API orchestrator coordinates the Main Organizer Agent and Sponsorship Agent as sibling agents. The Sponsorship Agent receives the Organizer output as context, then the combined result is saved to Supabase when configured.

## Existing Agents

### Venue Agent

Finds, compares, and recommends venues with explainable scoring across 11 dimensions, risk analysis, outreach email drafts, and human approval checkpoints before contacting venues.

### Community Agent

Creates Discord server structure, roles with permission logic, welcome flows, rules, announcement templates, bot automation design, moderation workflow, and community health tracking.

## Future Integrations

Mock mode is enabled by default. Production integrations planned for:

- Discord API
- Google Maps API
- Venue marketplace APIs
- Email API
- CRM
- Airtable / Database
- Stripe / Invoicing
- Calendar API
