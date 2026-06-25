import type { Currency } from "../../payments/types.js";

export interface SponsorLead {
  sponsorId: string;
  sponsorName: string;
  contactName: string;
  contactEmail: string;
  packageName: string;
  amount: number;
  currency: Currency;
  /** Where the lead currently sits before payment work begins. */
  stage: "interested" | "meeting_booked" | "verbally_committed";
}

export interface SponsorshipAgentInput {
  eventId: string;
  eventName: string;
  fundraisingGoal: number;
  currency: Currency;
  leads: SponsorLead[];
}

/** Human-approval checkpoint returned before a payment link is sent. */
export interface PaymentLinkApproval {
  action: "send_payment_link";
  approvalId: string;
  paymentIntentId: string;
  commitmentId: string;
  sponsorName: string;
  amount: number;
  currency: Currency;
  packageName: string;
  checkoutUrl: string;
  messageDraft: string;
  approvalRequired: true;
  approvalStatus: "pending" | "approved" | "rejected";
}

export interface SponsorshipAgentOutput {
  agent: "sponsorship-agent";
  status: "pending_approval" | "completed";
  eventId: string;
  eventName: string;
  fundraisingGoal: number;
  currency: Currency;
  approvals: PaymentLinkApproval[];
  approvalRequired: boolean;
  summary: {
    totalCommitted: number;
    totalPaid: number;
    totalPending: number;
  };
  nextActions: string[];
}
