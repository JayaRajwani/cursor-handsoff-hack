import { VenueAgent } from "../agents/venue/VenueAgent.js";
import { CommunityAgent } from "../agents/community/CommunityAgent.js";
import type { EventBrief, OrchestrationResult } from "./types.js";
import type { VenueAgentOutput } from "../agents/venue/types.js";
import type { CommunityAgentOutput } from "../agents/community/types.js";

export interface OrchestratorOptions {
  mockMode?: boolean;
}

export class MainAgentOrchestrator {
  readonly venueAgent: VenueAgent;
  readonly communityAgent: CommunityAgent;

  constructor(options: OrchestratorOptions = {}) {
    const context = { mockMode: options.mockMode ?? true };
    this.venueAgent = new VenueAgent(context);
    this.communityAgent = new CommunityAgent(context);
  }

  async runVenueAgent(eventBrief: EventBrief): Promise<VenueAgentOutput> {
    await this.venueAgent.plan(eventBrief);
    return this.venueAgent.execute();
  }

  async runCommunityAgent(eventBrief: EventBrief): Promise<CommunityAgentOutput> {
    await this.communityAgent.plan(eventBrief);
    return this.communityAgent.execute();
  }

  async runAll(eventBrief: EventBrief): Promise<OrchestrationResult> {
    const [venue, community] = await Promise.all([
      this.runVenueAgent(eventBrief),
      this.runCommunityAgent(eventBrief),
    ]);

    return {
      venue,
      community,
      timestamp: new Date().toISOString(),
    };
  }

  approveVenueOutreach(approvalId: string, approved: boolean): void {
    this.venueAgent.resumeAfterApproval(approvalId, approved);
  }

  approveCommunityAction(approvalId: string, approved: boolean): void {
    this.communityAgent.resumeAfterApproval(approvalId, approved);
  }
}

export function createOrchestrator(options?: OrchestratorOptions): MainAgentOrchestrator {
  return new MainAgentOrchestrator(options);
}
