import type { VenueAgentInput, VenueRecord, OutreachDraft } from "./types.js";

/** Future integration: email API, CRM */
export interface EmailSender {
  send(to: string, subject: string, body: string): Promise<{ sent: boolean; messageId?: string }>;
}

export class MockEmailSender implements EmailSender {
  async send(to: string, subject: string, body: string): Promise<{ sent: boolean; messageId?: string }> {
    console.log(`[MOCK EMAIL] To: ${to}\nSubject: ${subject}\n---\n${body.slice(0, 200)}...`);
    return { sent: true, messageId: `mock-${Date.now()}` };
  }
}

function formatDateRange(input: VenueAgentInput): string {
  if (input.targetDateRange) {
    return `${input.targetDateRange.start} to ${input.targetDateRange.end}`;
  }
  return "dates to be confirmed";
}

export function generateOutreachEmail(
  venue: VenueRecord,
  input: VenueAgentInput,
  reason: string,
): OutreachDraft {
  const dateRange = formatDateRange(input);
  const facilities = (input.requiredFacilities ?? []).join(", ");
  const subject = `Hackathon Venue Enquiry — ${input.eventName} (${dateRange})`;

  const body = `Dear ${venue.contactPerson ?? "Events Team"},

I'm reaching out from HackOS, an AI-powered event company that plans and operates hackathons end-to-end. We're organising ${input.eventName} in ${input.city} and believe ${venue.name} could be an excellent fit.

**Event overview**
- Event: ${input.eventName}
- Expected attendance: ${input.expectedParticipants} participants, plus ${(input.expectedOrganisers ?? 10) + (input.expectedJudgesAndMentors ?? 20)} organisers, mentors, and judges
- Duration: ${input.duration}
- Target dates: ${dateRange}
- Tracks: ${input.tracks.join(", ")}

**What we need**
- ${facilities || "High-speed WiFi, ample power, breakout rooms, AV for ceremonies"}
${input.requiresOvernightAccess ? "- 24-hour venue access for the full hackathon duration\n" : ""}${input.cateringRequirements?.length ? `- Catering: ${input.cateringRequirements.join(", ")}\n` : ""}${input.sponsorBrandRequirements?.length ? `- Sponsor visibility: ${input.sponsorBrandRequirements.join(", ")}\n` : ""}
**Could you please share:**
1. Availability for our target dates
2. Full pricing breakdown (venue hire, deposit, any surcharges)
3. WiFi specifications and capacity for ${input.expectedParticipants}+ devices
4. Overnight access policy and any associated fees
5. Catering options and restrictions
6. Insurance and contract requirements

We're aiming to confirm a venue within the next two weeks and would love to schedule a site visit at your convenience.

Warm regards,
HackOS Venue Operations
events@hackos.dev
+44 20 7946 0958

---
HackOS — The AI event company`;

  const venueSummary = `${venue.name} (${venue.address}) — Capacity ${venue.capacity}, est. £${venue.estimatedCost.toLocaleString()}, WiFi: ${venue.wifiQuality}, ${venue.overnightPolicy.split(".")[0]}.`;

  return {
    venueId: venue.id,
    venueName: venue.name,
    contactEmail: venue.contactEmail,
    subject,
    body,
    approvalStatus: "pending",
    reason,
    venueSummary,
  };
}

export function generateOutreachDrafts(
  venues: VenueRecord[],
  input: VenueAgentInput,
  topVenueId: string,
): OutreachDraft[] {
  const topVenue = venues.find((v) => v.id === topVenueId);
  if (!topVenue) return [];

  return [
    generateOutreachEmail(
      topVenue,
      input,
      `Top-ranked venue (highest overall score) for ${input.eventName}. Best balance of capacity, infrastructure, and budget.`,
    ),
  ];
}

export async function sendOutreachEmail(
  draft: OutreachDraft,
  sender: EmailSender,
  approved: boolean,
): Promise<OutreachDraft> {
  if (!approved) {
    return { ...draft, approvalStatus: "pending" };
  }

  await sender.send(draft.contactEmail, draft.subject, draft.body);
  return { ...draft, approvalStatus: "sent" };
}
