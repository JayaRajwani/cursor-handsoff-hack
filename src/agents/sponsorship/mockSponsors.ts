import type { SponsorLead } from "./types.js";

/** Mock sponsor pipeline for the London AI Builders Hackathon. */
export const MOCK_SPONSOR_LEADS: SponsorLead[] = [
  {
    sponsorId: "sponsor_openai",
    sponsorName: "OpenAI",
    contactName: "Jane Smith",
    contactEmail: "jane@openai.com",
    packageName: "Gold Sponsor",
    amount: 25000,
    currency: "GBP",
    stage: "verbally_committed",
  },
  {
    sponsorId: "sponsor_replit",
    sponsorName: "Replit",
    contactName: "Amjad Patel",
    contactEmail: "partnerships@replit.com",
    packageName: "Community Sponsor",
    amount: 5000,
    currency: "GBP",
    stage: "verbally_committed",
  },
];
