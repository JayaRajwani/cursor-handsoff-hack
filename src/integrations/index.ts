/** Future integration stubs — replace mock implementations with real API clients */

export interface IntegrationStatus {
  name: string;
  status: "mock" | "ready" | "connected";
  description: string;
}

export const FUTURE_INTEGRATIONS: IntegrationStatus[] = [
  { name: "Discord API", status: "mock", description: "Server creation, channels, roles, messages, automations" },
  { name: "Google Maps API", status: "mock", description: "Venue location, transport links, accessibility mapping" },
  { name: "Venue Marketplace APIs", status: "mock", description: "Real-time venue search, availability, pricing" },
  { name: "Email API", status: "mock", description: "Venue outreach, participant communications (SendGrid/Resend)" },
  { name: "CRM", status: "mock", description: "Venue relationship tracking, sponsor pipeline" },
  { name: "Airtable / Database", status: "mock", description: "Event data, submissions, team formation index" },
  { name: "Stripe / Invoicing", status: "mock", description: "Venue deposits, sponsor payments, ticket sales" },
  { name: "Calendar API", status: "mock", description: "Event scheduling, deadline reminders, mentor availability" },
];
