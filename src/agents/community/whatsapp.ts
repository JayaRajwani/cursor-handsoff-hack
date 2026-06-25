import type {
  AnnouncementTemplate,
  BotAutomation,
  CommunityAgentInput,
  WelcomeMessage,
  WhatsAppBroadcastTemplate,
  WhatsAppGroup,
  WhatsAppPlan,
} from "./types.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Future integration: WhatsApp Business Cloud API (Meta Graph API) or an
 * on-device provider such as Twilio WhatsApp / 360dialog. The Cloud API does
 * not expose programmatic group management, so production deployments either
 * use the Communities product with invite links or a BSP that wraps it. Group
 * provisioning here is therefore modelled as an operator-assisted action.
 */
export interface WhatsAppClient {
  createCommunity(name: string, description: string): Promise<{ communityId: string }>;
  createGroup(
    communityId: string,
    group: { name: string; adminOnly: boolean },
  ): Promise<{ groupId: string; inviteLink: string }>;
  registerTemplate(template: {
    name: string;
    category: "UTILITY" | "MARKETING";
    language: string;
    body: string;
  }): Promise<{ templateId: string; status: "PENDING" | "APPROVED" }>;
  sendTemplate(
    groupId: string,
    templateName: string,
    variables: string[],
  ): Promise<{ messageId: string }>;
  recordOptIn(phone: string, consent: boolean): Promise<void>;
}

export class MockWhatsAppClient implements WhatsAppClient {
  private communities = new Map<string, { name: string; groups: string[] }>();
  private optIns = new Map<string, boolean>();

  async createCommunity(name: string, description: string): Promise<{ communityId: string }> {
    const communityId = `mock-wa-community-${name.length}`;
    this.communities.set(communityId, { name, groups: [] });
    console.log(`[MOCK WHATSAPP] Created community: ${name} — ${description.slice(0, 50)}...`);
    return { communityId };
  }

  async createGroup(
    communityId: string,
    group: { name: string; adminOnly: boolean },
  ): Promise<{ groupId: string; inviteLink: string }> {
    const groupId = `mock-wa-group-${slugify(group.name)}`;
    this.communities.get(communityId)?.groups.push(groupId);
    console.log(
      `[MOCK WHATSAPP] Created group "${group.name}"${group.adminOnly ? " (admin-only)" : ""} in ${communityId}`,
    );
    return { groupId, inviteLink: `https://chat.whatsapp.com/mock-${slugify(group.name)}` };
  }

  async registerTemplate(template: {
    name: string;
    category: "UTILITY" | "MARKETING";
    language: string;
    body: string;
  }): Promise<{ templateId: string; status: "PENDING" | "APPROVED" }> {
    console.log(`[MOCK WHATSAPP] Registered template ${template.name} (${template.category}) — pending Meta review`);
    return { templateId: `mock-wa-tpl-${template.name}`, status: "PENDING" };
  }

  async sendTemplate(
    groupId: string,
    templateName: string,
    variables: string[],
  ): Promise<{ messageId: string }> {
    console.log(`[MOCK WHATSAPP] Sent ${templateName} to ${groupId} with [${variables.join(", ")}]`);
    return { messageId: `mock-wa-msg-${templateName}` };
  }

  async recordOptIn(phone: string, consent: boolean): Promise<void> {
    this.optIns.set(phone, consent);
    console.log(`[MOCK WHATSAPP] Recorded opt-in for ${phone}: ${consent}`);
  }
}

/** Announcement types that warrant a push to participants' phones, in send order. */
const BROADCASTABLE: Array<{
  announcementType: string;
  name: string;
  category: "UTILITY" | "MARKETING";
}> = [
  { announcementType: "registration_open", name: "registration_open", category: "MARKETING" },
  { announcementType: "registration_closing", name: "registration_closing", category: "MARKETING" },
  { announcementType: "venue_confirmed", name: "venue_confirmed", category: "UTILITY" },
  { announcementType: "schedule_released", name: "schedule_released", category: "UTILITY" },
  { announcementType: "hackathon_starting", name: "hackathon_starting", category: "UTILITY" },
  { announcementType: "meal_announcement", name: "meal_service", category: "UTILITY" },
  { announcementType: "submission_deadline", name: "submission_deadline", category: "UTILITY" },
  { announcementType: "judging_starting", name: "judging_starting", category: "UTILITY" },
  { announcementType: "winners_announced", name: "winners_announced", category: "UTILITY" },
  { announcementType: "post_event_followup", name: "post_event_followup", category: "MARKETING" },
];

export function generateWhatsAppGroups(input: CommunityAgentInput): WhatsAppGroup[] {
  const cap = 1024;
  const fixed: WhatsAppGroup[] = [
    {
      id: "wa-announcements",
      name: "📢 Announcements",
      type: "announcement",
      purpose: "Official one-way broadcasts. Mirrors Discord #announcements.",
      adminOnly: true,
      inviteVisibility: "public",
      linkedDiscordChannel: "announcements",
      memberCap: cap,
    },
    {
      id: "wa-general",
      name: "💬 General Chat",
      type: "discussion",
      purpose: "Participant cross-talk, quick questions, real-time buzz during the event.",
      adminOnly: false,
      inviteVisibility: "approval",
      linkedDiscordChannel: "general",
      memberCap: cap,
    },
    {
      id: "wa-help",
      name: "🆘 Help Desk",
      type: "support",
      purpose: "On-site and technical help; routed to organisers and volunteers.",
      adminOnly: false,
      inviteVisibility: "approval",
      linkedDiscordChannel: "ask-organisers",
      memberCap: cap,
    },
    {
      id: "wa-logistics",
      name: "🚌 Logistics & Travel",
      type: "support",
      purpose: "Directions, transport, check-in, meals, and venue access updates.",
      adminOnly: false,
      inviteVisibility: "approval",
      linkedDiscordChannel: "venue-info",
      memberCap: cap,
    },
  ];

  const trackGroups: WhatsAppGroup[] = input.tracks.map((track) => ({
    id: `wa-track-${slugify(track)}`,
    name: `🎯 ${track}`,
    type: "track",
    purpose: `Coordination for the ${track} track.`,
    adminOnly: false,
    inviteVisibility: "approval",
    linkedDiscordChannel: `track-${slugify(track)}`,
    memberCap: cap,
  }));

  const privateGroups: WhatsAppGroup[] = [
    {
      id: "wa-organisers",
      name: "🛠 Organisers Ops",
      type: "private",
      purpose: "Core organiser coordination and live decision-making.",
      adminOnly: false,
      inviteVisibility: "private",
      allowedRoles: ["Organiser", "Moderator"],
      linkedDiscordChannel: "organisers",
      memberCap: 256,
    },
    {
      id: "wa-mentors",
      name: "🧑‍🏫 Mentors",
      type: "private",
      purpose: "Mentor scheduling and request routing.",
      adminOnly: false,
      inviteVisibility: "private",
      allowedRoles: ["Organiser", "Moderator", "Mentor"],
      linkedDiscordChannel: "mentors",
      memberCap: 256,
    },
    {
      id: "wa-incident",
      name: "🚨 On-site Ops / Incident",
      type: "private",
      purpose: "Safety, incident response, and emergency coordination on the ground.",
      adminOnly: false,
      inviteVisibility: "private",
      allowedRoles: ["Organiser", "Moderator"],
      linkedDiscordChannel: "incident-response",
      memberCap: 64,
    },
  ];

  return [...fixed, ...trackGroups, ...privateGroups];
}

export function generateWhatsAppBroadcastTemplates(
  input: CommunityAgentInput,
  announcements: AnnouncementTemplate[],
): WhatsAppBroadcastTemplate[] {
  const lang = "en_GB";
  const byType = new Map(announcements.map((a) => [a.type, a]));

  return BROADCASTABLE.filter((b) => byType.has(b.announcementType)).map((b) => {
    const announcement = byType.get(b.announcementType)!;
    const spec = TEMPLATE_BODIES[b.announcementType];
    return {
      id: `wa-tpl-${b.name}`,
      name: b.name,
      category: b.category,
      announcementType: b.announcementType,
      language: lang,
      body: spec ? spec.body(input) : `${announcement.title} — see #${announcement.channels[0] ?? "announcements"}.`,
      variables: spec ? spec.variables : [],
      targetGroups: b.announcementType.startsWith("registration")
        ? ["wa-announcements"]
        : ["wa-announcements", "wa-general"],
      requiresOptIn: b.category === "MARKETING",
    };
  });
}

/**
 * WhatsApp template bodies use {{n}} positional placeholders. Keeping copy
 * short and transactional improves Meta approval rates for UTILITY templates.
 */
const TEMPLATE_BODIES: Record<
  string,
  { body: (i: CommunityAgentInput) => string; variables: string[] }
> = {
  registration_open: {
    body: (i) =>
      `🎉 Registration is open for ${i.eventName}! {{1}} spots in ${i.city}. Tracks: ${i.tracks.join(", ")}. Register: {{2}}`,
    variables: ["participant target", "registration link"],
  },
  registration_closing: {
    body: (i) => `⏰ Registration for ${i.eventName} closes {{1}}. Last chance to grab a spot — register: {{2}}`,
    variables: ["closing date", "registration link"],
  },
  venue_confirmed: {
    body: (i) => `📍 Venue confirmed for ${i.eventName}: {{1}}. Directions and WiFi details: {{2}}`,
    variables: ["venue name", "venue-info link"],
  },
  schedule_released: {
    body: (i) => `📅 The ${i.eventName} schedule is live. Kickoff {{1}}. Full timeline: {{2}}`,
    variables: ["kickoff time", "schedule link"],
  },
  hackathon_starting: {
    body: (i) => `🚀 ${i.eventName} is LIVE! You have ${i.duration} to build. Good luck — help is in the Help Desk group.`,
    variables: [],
  },
  meal_announcement: {
    body: (i) => `🍕 Food is served at ${i.eventName}. Head to the dining area with your badge. Next service: {{1}}`,
    variables: ["next meal time"],
  },
  submission_deadline: {
    body: (i) => `⚠️ ${i.eventName} submissions close {{1}}. Submit repo + 3-min demo now: {{2}}`,
    variables: ["deadline", "submission link"],
  },
  judging_starting: {
    body: (i) => `⚖️ Judging has begun for ${i.eventName}. Thank you for an incredible ${i.duration}! Results at {{1}}.`,
    variables: ["awards time"],
  },
  winners_announced: {
    body: (i) => `🏆 Winners of ${i.eventName} are announced! Full results and showcase: {{1}}`,
    variables: ["results link"],
  },
  post_event_followup: {
    body: (i) => `🙏 Thank you for ${i.eventName}! Feedback survey: {{1}}. Photos within 48h. The community stays open.`,
    variables: ["survey link"],
  },
};

export function generateWhatsAppPlan(
  input: CommunityAgentInput,
  announcements: AnnouncementTemplate[],
): WhatsAppPlan {
  const groups = generateWhatsAppGroups(input);
  const broadcastTemplates = generateWhatsAppBroadcastTemplates(input, announcements);

  return {
    platform: "WhatsApp",
    enabled: input.whatsappEnabled ?? true,
    communityName: `${input.eventName} (WhatsApp)`,
    description: `WhatsApp community for ${input.eventName} — real-time, mobile-first updates alongside Discord.`,
    defaultCountryCode: input.whatsappCountryCode ?? "+44",
    groups,
    broadcastTemplates,
    optInPolicy:
      "Participants opt in to WhatsApp during registration. MARKETING templates require explicit consent; UTILITY (event-critical) templates are sent within the operational relationship. Opt-out via STOP is honoured immediately.",
    totalGroups: groups.length,
  };
}

/** WhatsApp-specific bot automations, merged into the agent's automation list. */
export function generateWhatsAppAutomations(): BotAutomation[] {
  return [
    {
      id: "wa-bot-optin",
      name: "Collect WhatsApp opt-in",
      description: "Capture consent and verify participant phone number at registration",
      trigger: "Registration form submitted with WhatsApp opt-in checked",
      action: "Send verification code, record consent, add to broadcast audience",
      mockImplementation: "mockWhatsApp.recordOptIn(phone, consent)",
      futureIntegration: "WhatsApp Business Cloud API — opt-in webhook + verification template",
    },
    {
      id: "wa-bot-invite",
      name: "Issue group invite links",
      description: "Send the relevant WhatsApp group invite links based on selected track and role",
      trigger: "Opt-in confirmed or role assigned",
      action: "DM invite links for Announcements, General, and the participant's track group",
      mockImplementation: "mockWhatsApp.createGroup() invite links routed by role/track",
      futureIntegration: "WhatsApp Communities invite links + Discord role sync",
    },
    {
      id: "wa-bot-broadcast",
      name: "Send approved broadcasts",
      description: "Push approved announcement templates to WhatsApp groups in sync with Discord",
      trigger: "Organiser /announce after approval, or scheduled job",
      action: "Send pre-approved WhatsApp template to target groups",
      mockImplementation: "mockWhatsApp.sendTemplate(groupId, templateName, vars)",
      futureIntegration: "WhatsApp Business Cloud API — POST /{phone-number-id}/messages (template)",
    },
    {
      id: "wa-bot-help-route",
      name: "Route Help Desk messages",
      description: "Triage inbound WhatsApp Help Desk messages to organisers/volunteers",
      trigger: "Inbound message in Help Desk or Logistics group",
      action: "Tag urgency, notify on-call organiser, mirror to Discord #ask-organisers",
      mockImplementation: "mockRouteHelp(messageId, group)",
      futureIntegration: "WhatsApp Business Cloud API inbound webhook + Discord bridge",
    },
  ];
}

/** Onboarding message pointing participants to the WhatsApp community. */
export function generateWhatsAppWelcomeMessage(input: CommunityAgentInput): WelcomeMessage {
  return {
    channel: "start-here",
    title: "Join the WhatsApp Community (optional)",
    order: 6,
    content: `# Get updates on WhatsApp 📱

Prefer your phone? ${input.eventName} runs a WhatsApp community alongside Discord for time-critical updates.

**How to join:**
1. Tick "WhatsApp updates" during registration (or reply to your confirmation message)
2. Verify your number
3. We'll send you invite links for 📢 Announcements, 💬 General, and your track group

**What you'll get:** venue and schedule alerts, meal calls, the kickoff and submission-deadline pings — the things you don't want to miss.

You can leave or send **STOP** any time. Event-critical alerts only; no spam. Full details and rules still live in #rules.`,
  };
}
