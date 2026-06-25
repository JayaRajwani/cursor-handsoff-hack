import { runOrganizerAgent, type OrganizerOutput } from "./agents/organizerAgent.js";
import { runSponsorshipAgent, type SponsorshipOutput } from "./agents/sponsorshipAgent.js";
import { saveHackOSRun, type SupabaseSaveResult } from "./supabase.js";

export type HackOSRunResult = {
  goal: string;
  organizer: OrganizerOutput;
  sponsorship: SponsorshipOutput;
  persistence: SupabaseSaveResult;
  metadata: {
    agentSources: {
      organizer: "openai" | "mock";
      sponsorship: "openai" | "mock";
    };
    agentErrors: {
      organizer?: string;
      sponsorship?: string;
      supabase?: string;
    };
    createdAt: string;
  };
};

export async function runHackOS(goal: string): Promise<HackOSRunResult> {
  const organizerRun = await runOrganizerAgent(goal);
  const sponsorshipRun = await runSponsorshipAgent(goal, organizerRun.data);

  const resultWithoutPersistence = {
    goal,
    organizer: organizerRun.data,
    sponsorship: sponsorshipRun.data,
    persistence: { saved: false, error: "Persistence has not run yet." } satisfies SupabaseSaveResult,
    metadata: {
      agentSources: {
        organizer: organizerRun.source,
        sponsorship: sponsorshipRun.source
      },
      agentErrors: {
        ...(organizerRun.error ? { organizer: organizerRun.error } : {}),
        ...(sponsorshipRun.error ? { sponsorship: sponsorshipRun.error } : {})
      },
      createdAt: new Date().toISOString()
    }
  };

  const persistence = await saveHackOSRun(resultWithoutPersistence);

  return {
    ...resultWithoutPersistence,
    persistence,
    metadata: {
      ...resultWithoutPersistence.metadata,
      agentErrors: {
        ...resultWithoutPersistence.metadata.agentErrors,
        ...(!persistence.saved ? { supabase: persistence.error } : {})
      }
    }
  };
}
