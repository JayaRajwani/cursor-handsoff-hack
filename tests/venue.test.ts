import { describe, it, expect } from "vitest";
import { mockEventBrief } from "../src/data/mockEventBrief.js";
import { scoreVenue, rankVenues } from "../src/agents/venue/scoring.js";
import { analyzeVenueRisks } from "../src/agents/venue/riskAnalysis.js";
import { MOCK_LONDON_VENUES } from "../src/agents/venue/mockVenues.js";
import { VenueAgent } from "../src/agents/venue/VenueAgent.js";

describe("venue scoring", () => {
  it("scores a venue across all 11 dimensions with reasoning", () => {
    const venue = MOCK_LONDON_VENUES[0]!;
    const score = scoreVenue(venue, mockEventBrief);

    expect(score.dimensions).toHaveLength(11);
    expect(score.totalScore).toBeGreaterThan(0);
    expect(score.totalScore).toBeLessThanOrEqual(100);
    for (const dim of score.dimensions) {
      expect(dim.reasoning.length).toBeGreaterThan(0);
      expect(dim.score).toBeGreaterThanOrEqual(0);
      expect(dim.score).toBeLessThanOrEqual(100);
    }
  });

  it("ranks venues with TechHub or CodeNode near the top for 500-person hackathon", () => {
    const ranked = rankVenues(MOCK_LONDON_VENUES, mockEventBrief);
    const topNames = ranked.slice(0, 3).map((r) => r.venue.name);

    expect(topNames.some((n) => n.includes("TechHub") || n.includes("CodeNode"))).toBe(true);
  });

  it("penalises venues without overnight access when required", () => {
    const trampery = MOCK_LONDON_VENUES.find((v) => v.name.includes("Trampery"))!;
    const score = scoreVenue(trampery, mockEventBrief);
    const overnightDim = score.dimensions.find((d) => d.dimension === "overnightFeasibility");

    expect(overnightDim!.score).toBeLessThan(30);
    expect(overnightDim!.reasoning).toContain("FAILS");
  });

  it("penalises over-budget venues", () => {
    const qeiic = MOCK_LONDON_VENUES.find((v) => v.name.includes("Queen Elizabeth"))!;
    const score = scoreVenue(qeiic, mockEventBrief);
    const costDim = score.dimensions.find((d) => d.dimension === "totalCost");

    expect(costDim!.score).toBeLessThan(60);
  });
});

describe("risk analysis", () => {
  it("identifies risks with severity and mitigation", () => {
    const venue = MOCK_LONDON_VENUES.find((v) => v.hiddenCosts?.length)!;
    const risks = analyzeVenueRisks(venue);

    expect(risks.risks.length).toBeGreaterThan(0);
    expect(risks.riskLevel).toMatch(/low|medium|high/);
    for (const risk of risks.risks) {
      expect(risk.mitigation.length).toBeGreaterThan(0);
    }
  });

  it("flags high risk for venues with no overnight and insufficient power", () => {
    const trampery = MOCK_LONDON_VENUES.find((v) => v.name.includes("Trampery"))!;
    const risks = analyzeVenueRisks(trampery);

    expect(risks.risks.some((r) => r.category.includes("overnight"))).toBe(true);
    expect(risks.riskLevel).toMatch(/medium|high/);
  });
});

describe("venue recommendation", () => {
  it("returns ranked shortlist of 3-5 venues with top recommendation", async () => {
    const agent = new VenueAgent({ mockMode: true });
    await agent.plan(mockEventBrief);
    const output = await agent.execute();

    expect(output.rankedVenues.length).toBeGreaterThanOrEqual(3);
    expect(output.rankedVenues.length).toBeLessThanOrEqual(5);
    expect(output.topRecommendation).not.toBeNull();
    expect(output.topRecommendation!.whyBest.length).toBeGreaterThan(0);
    expect(output.topRecommendation!.emailDraft.length).toBeGreaterThan(0);
    expect(output.topRecommendation!.fallback.venueName).not.toBe("None identified");
  });
});

describe("approval checkpoint behaviour", () => {
  it("requires approval before venue outreach", async () => {
    const agent = new VenueAgent({ mockMode: true });
    await agent.plan(mockEventBrief);
    const output = await agent.execute();

    expect(output.status).toBe("pending_approval");
    expect(output.approvalRequired).toBe(true);
    expect(output.outreachDrafts[0]!.approvalStatus).toBe("pending");

    const approvals = agent.requestApproval();
    expect(approvals.length).toBeGreaterThan(0);
    expect(approvals[0]!.status).toBe("pending");
  });

  it("resolves approval after resumeAfterApproval", async () => {
    const agent = new VenueAgent({ mockMode: true });
    await agent.plan(mockEventBrief);
    await agent.execute();

    const approvals = agent.requestApproval();
    const approvalId = approvals[0]!.id;
    agent.resumeAfterApproval(approvalId, true);

    const resolved = agent.requestApproval();
    expect(resolved.find((a) => a.id === approvalId)).toBeUndefined();
  });
});
