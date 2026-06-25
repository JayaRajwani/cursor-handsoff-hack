import { CommunityAgent } from "../agents/community/CommunityAgent.js";
import type { CommunityAgentOutput } from "../agents/community/types.js";
import {
  organizerToEventBrief,
  runOrganizerAgent,
  type OrganizerOutput,
} from "../agents/organizer/OrganizerAgent.js";
import { SponsorshipAgent } from "../agents/sponsorship/SponsorshipAgent.js";
import type { SponsorshipAgentInput, SponsorshipAgentOutput } from "../agents/sponsorship/types.js";
import { createPaymentService } from "../payments/PaymentService.js";
import type { PayPalMode } from "../payments/config.js";
import { saveHackOSRun, type SupabaseSaveResult } from "../persistence/supabase.js";

export interface PayPalRunOutput {
  mode: PayPalMode | "unavailable";
  status: "ready" | "failed";
  pendingApprovals: Array<{
    sponsorName: string;
    amount: number;
    currency: string;
    packageName: string;
    paymentIntentId: string;
    checkoutUrl: string;
    messageDraft: string;
  }>;
  error?: string;
}

export interface HackOSRunResult {
  goal: string;
  organizer: OrganizerOutput;
  community: CommunityAgentOutput | null;
  sponsorship: SponsorshipAgentOutput | null;
  paypal: PayPalRunOutput;
  whatsapp: CommunityAgentOutput["whatsappPlan"] | null;
  persistence: SupabaseSaveResult;
  metadata: {
    eventId: string;
    agentSources: {
      organizer: "openai" | "mock";
      community: "mock";
      sponsorship: "mock";
      paypal: PayPalMode | "unavailable";
      whatsapp: "mock" | "skipped";
    };
    agentErrors: {
      organizer?: string;
      community?: string;
      sponsorship?: string;
      paypal?: string;
      supabase?: string;
    };
    createdAt: string;
  };
}

export async function runHackOS(goal: string): Promise<HackOSRunResult> {
  const eventId = `hackos_${Date.now()}`;
  const organizerRun = await runOrganizerAgent(goal);
  const eventBrief = organizerToEventBrief(goal, organizerRun.data);
  const errors: HackOSRunResult["metadata"]["agentErrors"] = {
    ...(organizerRun.error ? { organizer: organizerRun.error } : {}),
  };

  const community = await runCommunity(eventBrief, errors);
  const sponsorship = await runSponsorship(
    {
      eventId,
      eventName: eventBrief.eventName,
      fundraisingGoal: organizerRun.data.sponsorshipBrief.fundraisingGoal,
      currency: organizerRun.data.sponsorshipBrief.currency,
      leads: organizerRun.data.sponsorshipBrief.leads,
    },
    errors,
  );
  const paypal = buildPayPalOutput(sponsorship, errors.paypal);

  const resultWithoutPersistence: HackOSRunResult = {
    goal,
    organizer: organizerRun.data,
    community,
    sponsorship,
    paypal,
    whatsapp: community?.whatsappPlan ?? null,
    persistence: { saved: false, error: "Persistence has not run yet." },
    metadata: {
      eventId,
      agentSources: {
        organizer: organizerRun.source,
        community: "mock",
        sponsorship: "mock",
        paypal: paypal.mode,
        whatsapp: community?.whatsappPlan.enabled ? "mock" : "skipped",
      },
      agentErrors: errors,
      createdAt: new Date().toISOString(),
    },
  };

  const persistence = await saveHackOSRun(resultWithoutPersistence);

  return {
    ...resultWithoutPersistence,
    persistence,
    metadata: {
      ...resultWithoutPersistence.metadata,
      agentErrors: {
        ...resultWithoutPersistence.metadata.agentErrors,
        ...(!persistence.saved ? { supabase: persistence.error } : {}),
      },
    },
  };
}

async function runCommunity(
  eventBrief: ReturnType<typeof organizerToEventBrief>,
  errors: HackOSRunResult["metadata"]["agentErrors"],
): Promise<CommunityAgentOutput | null> {
  try {
    const communityAgent = new CommunityAgent({ mockMode: true });
    await communityAgent.plan(eventBrief);
    return await communityAgent.execute();
  } catch (error) {
    errors.community = error instanceof Error ? error.message : "Unknown Community Agent error.";
    return null;
  }
}

async function runSponsorship(
  input: SponsorshipAgentInput,
  errors: HackOSRunResult["metadata"]["agentErrors"],
): Promise<SponsorshipAgentOutput | null> {
  try {
    const paymentService = createPaymentService();
    const sponsorshipAgent = new SponsorshipAgent({ mockMode: paymentService.mode === "mock", paymentService });
    await sponsorshipAgent.plan(input);
    return await sponsorshipAgent.execute();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Sponsorship/PayPal error.";
    errors.sponsorship = message;
    errors.paypal = message;
    return null;
  }
}

function buildPayPalOutput(sponsorship: SponsorshipAgentOutput | null, error?: string): PayPalRunOutput {
  if (!sponsorship) {
    return { mode: "unavailable", status: "failed", pendingApprovals: [], error };
  }

  const mode = inferPayPalMode(sponsorship.approvals);
  return {
    mode,
    status: "ready",
    pendingApprovals: sponsorship.approvals.map((approval) => ({
      sponsorName: approval.sponsorName,
      amount: approval.amount,
      currency: approval.currency,
      packageName: approval.packageName,
      paymentIntentId: approval.paymentIntentId,
      checkoutUrl: approval.checkoutUrl,
      messageDraft: approval.messageDraft,
    })),
  };
}

function inferPayPalMode(approvals: SponsorshipAgentOutput["approvals"]): PayPalMode {
  if (approvals.some((approval) => approval.checkoutUrl.includes("sandbox.paypal.com"))) return "sandbox";
  if (approvals.some((approval) => approval.checkoutUrl.includes("paypal.com"))) return "live";
  return "mock";
}
