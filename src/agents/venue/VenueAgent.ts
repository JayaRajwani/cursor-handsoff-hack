import { BaseAgent } from "../base/Agent.js";
import type { AgentPlan } from "../base/types.js";
import { searchVenues } from "./search.js";
import { rankVenues } from "./scoring.js";
import { analyzeAllVenueRisks } from "./riskAnalysis.js";
import { generateOutreachDrafts } from "./outreach.js";
import type {
  VenueAgentInput,
  VenueAgentOutput,
  TopRecommendation,
  VenueRecord,
  VenueScore,
} from "./types.js";

export class VenueAgent extends BaseAgent<VenueAgentInput, VenueAgentOutput> {
  readonly name = "venue-agent";
  readonly goal = "Find, compare and recommend the best venue for a hackathon";

  private rankedResults: Array<{ venue: VenueRecord; score: VenueScore }> = [];
  private allVenues: VenueRecord[] = [];

  async plan(input: VenueAgentInput): Promise<AgentPlan> {
    this.status = "planning";
    this.input = input;
    this.log("plan_started", { eventName: input.eventName, city: input.city });

    this.currentPlan = {
      agentName: this.name,
      goal: this.goal,
      tasks: [
        {
          id: "search-venues",
          name: "Search venues",
          description: `Search for venues in ${input.city} matching capacity and budget`,
          status: "pending",
          requiresApproval: false,
        },
        {
          id: "compare-venues",
          name: "Compare venues",
          description: "Score and rank venues across 11 dimensions with explainable reasoning",
          status: "pending",
          requiresApproval: false,
        },
        {
          id: "risk-analysis",
          name: "Risk analysis",
          description: "Identify operational risks for each shortlisted venue",
          status: "pending",
          requiresApproval: false,
        },
        {
          id: "recommend",
          name: "Generate recommendation",
          description: "Produce ranked shortlist and top recommendation with tradeoffs",
          status: "pending",
          requiresApproval: false,
        },
        {
          id: "outreach",
          name: "Venue outreach",
          description: "Draft personalised outreach email for top venue",
          status: "pending",
          requiresApproval: true,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    this.status = "idle";
    this.log("plan_completed", { taskCount: this.currentPlan.tasks.length });
    return this.currentPlan;
  }

  async execute(): Promise<VenueAgentOutput> {
    if (!this.input) {
      throw new Error("VenueAgent: call plan() before execute()");
    }

    this.status = "executing";
    const input = this.input;

    try {
      this.updateTaskStatus("search-venues", "in_progress");
      this.allVenues = await searchVenues({
        city: input.city,
        minCapacity: input.expectedParticipants,
        maxBudget: input.budget.venue,
        mockMode: this.context.mockMode,
      });
      this.updateTaskStatus("search-venues", "completed");
      this.log("venues_found", { count: this.allVenues.length });

      this.updateTaskStatus("compare-venues", "in_progress");
      this.rankedResults = rankVenues(this.allVenues, input);
      this.updateTaskStatus("compare-venues", "completed");
      this.log("venues_ranked", {
        topVenue: this.rankedResults[0]?.venue.name,
        topScore: this.rankedResults[0]?.score.totalScore,
      });

      this.updateTaskStatus("risk-analysis", "in_progress");
      const shortlisted = this.rankedResults.slice(0, 5).map((r) => r.venue);
      const risks = analyzeAllVenueRisks(shortlisted);
      this.updateTaskStatus("risk-analysis", "completed");

      this.updateTaskStatus("recommend", "in_progress");
      const topRecommendation = this.buildTopRecommendation(
        this.rankedResults[0],
        this.rankedResults[1],
        input,
      );
      this.updateTaskStatus("recommend", "completed");

      this.updateTaskStatus("outreach", "in_progress");
      const outreachDrafts = generateOutreachDrafts(
        shortlisted,
        input,
        this.rankedResults[0]?.venue.id ?? "",
      );

      for (const draft of outreachDrafts) {
        this.createApprovalRequest(
          "venue_outreach",
          `Contact ${draft.venueName} regarding venue hire`,
          `Send outreach email to ${draft.contactEmail}`,
          [draft.venueName, draft.contactEmail],
          draft.reason,
          {
            draftContent: `Subject: ${draft.subject}\n\n${draft.body}`,
            riskLevel: "medium",
          },
        );
      }
      this.updateTaskStatus("outreach", "completed");

      const nextActions = this.buildNextActions(topRecommendation, outreachDrafts);

      const output: VenueAgentOutput = {
        agent: "venue-agent",
        status: this.hasPendingApprovals() ? "pending_approval" : "completed",
        event: input,
        rankedVenues: this.rankedResults.slice(0, 5).map((r, i) => ({
          rank: i + 1,
          venue: r.venue,
          score: r.score,
        })),
        topRecommendation,
        risks,
        outreachDrafts,
        nextActions,
        approvalRequired: this.hasPendingApprovals(),
      };

      this.output = output;
      this.status = output.status === "pending_approval" ? "pending_approval" : "completed";
      this.log("execution_completed", { status: output.status });
      return output;
    } catch (error) {
      this.status = "failed";
      this.log("execution_failed", { error: String(error) });
      throw error;
    }
  }

  private buildTopRecommendation(
    top: { venue: VenueRecord; score: VenueScore } | undefined,
    fallback: { venue: VenueRecord; score: VenueScore } | undefined,
    input: VenueAgentInput,
  ): TopRecommendation | null {
    if (!top) return null;

    const { venue, score } = top;
    const hiddenCostTotal = venue.hiddenCosts?.length ? 2000 : 0;
    const estimatedTotalCost = venue.estimatedCost + venue.depositRequirement * 0.25 + hiddenCostTotal;

    const weakDims = score.dimensions
      .filter((d) => d.score < 60)
      .map((d) => d.reasoning);

    const outreachDraft = generateOutreachDrafts([venue], input, venue.id)[0];

    return {
      venue,
      score,
      whyBest: `${venue.name} scores ${score.totalScore}/100 — the highest among ${this.allVenues.length} candidates. ${score.summary} Key strengths: ${score.dimensions
        .filter((d) => d.score >= 85)
        .map((d) => d.dimension)
        .join(", ") || "balanced overall profile"}.`,
      tradeoffs: weakDims.length > 0 ? weakDims : ["No significant tradeoffs identified"],
      estimatedTotalCost,
      nextAction: `Request approval to send outreach email to ${venue.contactEmail}, then schedule site visit within 5 business days.`,
      emailDraft: outreachDraft?.body ?? "",
      negotiationAngle: this.buildNegotiationAngle(venue, input),
      fallback: fallback
        ? {
            venueId: fallback.venue.id,
            venueName: fallback.venue.name,
            reason: `${fallback.venue.name} scores ${fallback.score.totalScore}/100 — strong alternative if ${venue.name} is unavailable or over budget.`,
          }
        : {
            venueId: "",
            venueName: "None identified",
            reason: "No suitable fallback in current search results",
          },
    };
  }

  private buildNegotiationAngle(venue: VenueRecord, input: VenueAgentInput): string {
    const angles: string[] = [];

    if (venue.estimatedCost > input.budget.venue * 0.9) {
      angles.push("Request multi-day package discount given 48-hour duration");
    }
    if (venue.vibe === "university" || venue.vibe === "startup office") {
      angles.push("Offer brand association with high-profile AI event for portfolio/marketing");
    }
    angles.push("Propose flexible date alternatives within ±1 week for rate reduction");
    if (input.sponsorNames?.length) {
      angles.push(`Highlight sponsor exposure value (${input.sponsorNames.slice(0, 2).join(", ")})`);
    }

    return angles.join(". ") + ".";
  }

  private buildNextActions(
    top: TopRecommendation | null,
    drafts: ReturnType<typeof generateOutreachDrafts>,
  ): string[] {
    const actions: string[] = [];

    if (top) {
      actions.push(`Approve outreach to ${top.venue.name} (${top.venue.contactEmail})`);
      actions.push(`Schedule site visit at ${top.venue.name}`);
      actions.push(`Prepare fallback outreach to ${top.fallback.venueName} if no response within 5 days`);
    }

    if (drafts.some((d) => d.approvalStatus === "pending")) {
      actions.push("Review and approve venue outreach email draft");
    }

    actions.push("Confirm insurance requirements with legal team");
    actions.push("Block calendar dates pending venue confirmation");

    return actions;
  }

  private updateTaskStatus(
    taskId: string,
    status: "pending" | "in_progress" | "completed" | "skipped" | "blocked",
  ): void {
    if (!this.currentPlan) return;
    const task = this.currentPlan.tasks.find((t) => t.id === taskId);
    if (task) task.status = status;
  }
}
