import { describe, it, expect } from "vitest";
import { mockEventBrief } from "../src/data/mockEventBrief.js";
import { generateServerChannels, generateServerPlan } from "../src/agents/community/serverPlan.js";
import { getRoles, getPermissionRules, canRoleAccessChannel } from "../src/agents/community/roles.js";
import { generateAnnouncementTemplates } from "../src/agents/community/announcements.js";
import {
  generateWhatsAppPlan,
  generateWhatsAppGroups,
} from "../src/agents/community/whatsapp.js";
import { CommunityAgent } from "../src/agents/community/CommunityAgent.js";

describe("channel generation", () => {
  it("generates all standard channel categories", () => {
    const channels = generateServerChannels(mockEventBrief);
    const categories = new Set(channels.map((c) => c.category));

    expect(categories.has("WELCOME")).toBe(true);
    expect(categories.has("EVENT INFO")).toBe(true);
    expect(categories.has("TEAM FORMATION")).toBe(true);
    expect(categories.has("TRACKS")).toBe(true);
    expect(categories.has("SUPPORT")).toBe(true);
    expect(categories.has("COMMUNITY")).toBe(true);
    expect(categories.has("PRIVATE")).toBe(true);
  });

  it("creates one channel per hackathon track", () => {
    const channels = generateServerChannels(mockEventBrief);
    const trackChannels = channels.filter((c) => c.category === "TRACKS");

    expect(trackChannels).toHaveLength(mockEventBrief.tracks.length);
    expect(trackChannels.map((c) => c.name)).toContain("track-ai-safety");
    expect(trackChannels.map((c) => c.name)).toContain("track-creative-tools");
  });

  it("marks private channels correctly", () => {
    const channels = generateServerChannels(mockEventBrief);
    const privateChannels = channels.filter((c) => c.private);

    expect(privateChannels.map((c) => c.name)).toContain("organisers");
    expect(privateChannels.map((c) => c.name)).toContain("incident-response");
    expect(privateChannels.every((c) => c.allowedRoles?.length)).toBe(true);
  });

  it("generates server plan with correct totals", () => {
    const plan = generateServerPlan(mockEventBrief);
    expect(plan.totalChannels).toBe(generateServerChannels(mockEventBrief).length);
    expect(plan.platform).toBe("Discord");
    expect(plan.categories).toHaveLength(7);
  });
});

describe("role permissions", () => {
  it("defines all 12 required roles", () => {
    const roles = getRoles();
    const roleNames = roles.map((r) => r.name);

    for (const required of [
      "Organiser", "Moderator", "Mentor", "Judge", "Sponsor",
      "Hacker", "Designer", "Developer", "Researcher", "Beginner",
      "Team Lead", "Volunteer",
    ]) {
      expect(roleNames).toContain(required);
    }
  });

  it("gives organisers full access", () => {
    const rules = getPermissionRules();
    const organiserRule = rules.find((r) => r.role === "Organiser")!;

    expect(organiserRule.canAccess).toContain("ALL_CHANNELS");
    expect(organiserRule.cannotAccess).toHaveLength(0);
  });

  it("restricts judges from organiser channels", () => {
    expect(canRoleAccessChannel("Judge", "organisers")).toBe(false);
    expect(canRoleAccessChannel("Judge", "judges")).toBe(true);
    expect(canRoleAccessChannel("Judge", "general")).toBe(true);
  });

  it("restricts participants from incident-response", () => {
    expect(canRoleAccessChannel("Hacker", "incident-response")).toBe(false);
    expect(canRoleAccessChannel("Developer", "incident-response")).toBe(false);
    expect(canRoleAccessChannel("Moderator", "incident-response")).toBe(true);
  });

  it("allows sponsors access to sponsor channels only among private", () => {
    expect(canRoleAccessChannel("Sponsor", "sponsors")).toBe(true);
    expect(canRoleAccessChannel("Sponsor", "organisers")).toBe(false);
    expect(canRoleAccessChannel("Sponsor", "general")).toBe(true);
  });
});

describe("announcement generation", () => {
  it("generates all required announcement types", () => {
    const templates = generateAnnouncementTemplates(mockEventBrief);
    const types = templates.map((t) => t.type);

    for (const required of [
      "registration_open",
      "registration_closing",
      "venue_confirmed",
      "schedule_released",
      "team_formation_reminder",
      "hackathon_starting",
      "meal_announcement",
      "mentor_availability",
      "submission_deadline",
      "judging_starting",
      "winners_announced",
      "post_event_followup",
    ]) {
      expect(types).toContain(required);
    }
  });

  it("includes event name in announcement content", () => {
    const templates = generateAnnouncementTemplates(mockEventBrief);
    for (const template of templates) {
      expect(template.content).toContain(mockEventBrief.eventName);
      expect(template.channels.length).toBeGreaterThan(0);
    }
  });
});

describe("whatsapp community plan", () => {
  it("creates announcement, discussion, support, track, and private groups", () => {
    const groups = generateWhatsAppGroups(mockEventBrief);
    const types = new Set(groups.map((g) => g.type));

    expect(types.has("announcement")).toBe(true);
    expect(types.has("discussion")).toBe(true);
    expect(types.has("support")).toBe(true);
    expect(types.has("track")).toBe(true);
    expect(types.has("private")).toBe(true);
  });

  it("creates one WhatsApp group per track", () => {
    const groups = generateWhatsAppGroups(mockEventBrief);
    const trackGroups = groups.filter((g) => g.type === "track");
    expect(trackGroups).toHaveLength(mockEventBrief.tracks.length);
  });

  it("restricts the announcement group to admins and links it to Discord", () => {
    const groups = generateWhatsAppGroups(mockEventBrief);
    const announce = groups.find((g) => g.type === "announcement")!;
    expect(announce.adminOnly).toBe(true);
    expect(announce.linkedDiscordChannel).toBe("announcements");
  });

  it("keeps private groups gated by role", () => {
    const groups = generateWhatsAppGroups(mockEventBrief);
    const privateGroups = groups.filter((g) => g.type === "private");
    expect(privateGroups.length).toBeGreaterThan(0);
    expect(privateGroups.every((g) => (g.allowedRoles?.length ?? 0) > 0)).toBe(true);
    expect(privateGroups.every((g) => g.inviteVisibility === "private")).toBe(true);
  });

  it("derives broadcast templates from announcements and flags marketing opt-in", () => {
    const announcements = generateAnnouncementTemplates(mockEventBrief);
    const plan = generateWhatsAppPlan(mockEventBrief, announcements);

    expect(plan.platform).toBe("WhatsApp");
    expect(plan.enabled).toBe(true);
    expect(plan.broadcastTemplates.length).toBeGreaterThan(0);

    const reg = plan.broadcastTemplates.find((t) => t.announcementType === "registration_open")!;
    expect(reg.category).toBe("MARKETING");
    expect(reg.requiresOptIn).toBe(true);

    const venue = plan.broadcastTemplates.find((t) => t.announcementType === "venue_confirmed")!;
    expect(venue.category).toBe("UTILITY");
    expect(venue.requiresOptIn).toBe(false);
  });

  it("can be disabled via the event brief", () => {
    const plan = generateWhatsAppPlan(
      { ...mockEventBrief, whatsappEnabled: false },
      generateAnnouncementTemplates(mockEventBrief),
    );
    expect(plan.enabled).toBe(false);
  });
});

describe("approval checkpoint behaviour", () => {
  it("requires approval for channel creation and announcements", async () => {
    const agent = new CommunityAgent({ mockMode: true });
    await agent.plan(mockEventBrief);
    const output = await agent.execute();

    expect(output.status).toBe("pending_approval");
    expect(output.approvalRequired).toBe(true);

    const approvals = agent.requestApproval();
    expect(approvals.length).toBeGreaterThanOrEqual(4);

    const types = approvals.map((a) => a.type);
    expect(types).toContain("create_channels");
    expect(types).toContain("publish_rules");
    expect(types).toContain("schedule_announcements");
    expect(types).toContain("create_whatsapp_broadcast");

    const waApproval = approvals.find((a) => a.type === "create_whatsapp_broadcast")!;
    expect(waApproval.riskLevel).toBe("high");

    expect(output.whatsappPlan.platform).toBe("WhatsApp");
    expect(output.whatsappPlan.groups.length).toBeGreaterThan(0);
  });

  it("includes draft content in approval requests", async () => {
    const agent = new CommunityAgent({ mockMode: true });
    await agent.plan(mockEventBrief);
    await agent.execute();

    const rulesApproval = agent
      .getMemory()
      .find((m) => m.action === "approval_requested" && m.details.type === "publish_rules");
    expect(rulesApproval).toBeDefined();
  });
});
