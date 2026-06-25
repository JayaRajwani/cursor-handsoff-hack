import type { BotAutomation, CommunityHealth } from "./types.js";

/** Future integration: Discord API (discord.js / discord.py) */
export interface DiscordClient {
  createServer(name: string, description: string): Promise<{ serverId: string }>;
  createChannel(serverId: string, channel: { name: string; type: string; category?: string }): Promise<{ channelId: string }>;
  createRole(serverId: string, role: { name: string; color: string; permissions: string[] }): Promise<{ roleId: string }>;
  sendMessage(channelId: string, content: string): Promise<{ messageId: string }>;
  assignRole(serverId: string, userId: string, roleId: string): Promise<void>;
}

export class MockDiscordClient implements DiscordClient {
  private servers: Map<string, { name: string; channels: string[]; roles: string[] }> = new Map();

  async createServer(name: string, description: string): Promise<{ serverId: string }> {
    const serverId = `mock-server-${Date.now()}`;
    this.servers.set(serverId, { name, channels: [], roles: [] });
    console.log(`[MOCK DISCORD] Created server: ${name} — ${description.slice(0, 50)}...`);
    return { serverId };
  }

  async createChannel(
    serverId: string,
    channel: { name: string; type: string; category?: string },
  ): Promise<{ channelId: string }> {
    const channelId = `mock-ch-${channel.name}`;
    const server = this.servers.get(serverId);
    if (server) server.channels.push(channelId);
    console.log(`[MOCK DISCORD] Created #${channel.name} (${channel.type}) in ${serverId}`);
    return { channelId };
  }

  async createRole(
    serverId: string,
    role: { name: string; color: string; permissions: string[] },
  ): Promise<{ roleId: string }> {
    const roleId = `mock-role-${role.name.toLowerCase()}`;
    const server = this.servers.get(serverId);
    if (server) server.roles.push(roleId);
    console.log(`[MOCK DISCORD] Created role @${role.name} in ${serverId}`);
    return { roleId };
  }

  async sendMessage(channelId: string, content: string): Promise<{ messageId: string }> {
    console.log(`[MOCK DISCORD] Message in ${channelId}: ${content.slice(0, 80)}...`);
    return { messageId: `mock-msg-${Date.now()}` };
  }

  async assignRole(serverId: string, userId: string, roleId: string): Promise<void> {
    console.log(`[MOCK DISCORD] Assigned ${roleId} to ${userId} in ${serverId}`);
  }
}

export function generateBotAutomations(): BotAutomation[] {
  return [
    {
      id: "bot-roles",
      name: "Auto-assign roles",
      description: "Self-service role selection via reaction roles or /roles slash command",
      trigger: "User reacts to role message or runs /roles",
      action: "Assign selected Discord role(s) to user",
      mockImplementation: "mockAssignRole(userId, roleName)",
      futureIntegration: "Discord API — PUT /guilds/{guild.id}/members/{user.id}/roles/{role.id}",
    },
    {
      id: "bot-welcome",
      name: "Welcome new members",
      description: "Send personalised welcome DM and post in #welcome when member joins",
      trigger: "GUILD_MEMBER_ADD event",
      action: "Send welcome message with onboarding checklist",
      mockImplementation: "mockWelcomeMember(userId)",
      futureIntegration: "Discord API — Gateway GUILD_MEMBER_ADD + channel message",
    },
    {
      id: "bot-faq",
      name: "Answer FAQs",
      description: "Respond to common questions about schedule, venue, submissions",
      trigger: "Message in #faq matching FAQ pattern or /faq command",
      action: "Reply with relevant FAQ answer from knowledge base",
      mockImplementation: "mockAnswerFaq(question)",
      futureIntegration: "Discord API + AI SDK for intelligent FAQ matching",
    },
    {
      id: "bot-deadlines",
      name: "Deadline reminders",
      description: "Scheduled reminders for registration close, submission deadline, judging",
      trigger: "Cron schedule based on event timeline",
      action: "Post reminder in #announcements with countdown",
      mockImplementation: "mockScheduleReminder(templateId, datetime)",
      futureIntegration: "Discord API + calendar API integration",
    },
    {
      id: "bot-teams",
      name: "Collect team formation posts",
      description: "Parse and index team formation posts for matching",
      trigger: "New post in #find-a-team or role-specific channels",
      action: "Extract skills needed/offered, suggest matches",
      mockImplementation: "mockIndexTeamPost(postId, content)",
      futureIntegration: "Discord API + database (Airtable/Postgres)",
    },
    {
      id: "bot-mod-flag",
      name: "Flag moderation issues",
      description: "Auto-flag messages containing slurs, spam patterns, or report keywords",
      trigger: "MESSAGE_CREATE in any public channel",
      action: "Flag to #incident-response, optionally auto-mute repeat offenders",
      mockImplementation: "mockFlagMessage(messageId, reason)",
      futureIntegration: "Discord API + moderation bot (AutoMod)",
    },
    {
      id: "bot-announce",
      name: "Post scheduled announcements",
      description: "Post pre-approved announcement templates at scheduled times",
      trigger: "Scheduled job or organiser /announce command",
      action: "Post template content to specified channels",
      mockImplementation: "mockPostAnnouncement(templateId)",
      futureIntegration: "Discord API — requires approval gate before posting",
    },
    {
      id: "bot-submissions",
      name: "Collect project submissions",
      description: "Track submission status via /submit command",
      trigger: "User runs /submit with project details",
      action: "Validate submission, store in database, confirm in #submissions",
      mockImplementation: "mockCollectSubmission(userId, projectData)",
      futureIntegration: "Discord API + Devpost API + database",
    },
    {
      id: "bot-mentor",
      name: "Route mentor requests",
      description: "Route #mentor-requests to available mentors by expertise",
      trigger: "New message in #mentor-requests",
      action: "Notify relevant mentors, track response time",
      mockImplementation: "mockRouteMentorRequest(requestId, topic)",
      futureIntegration: "Discord API + mentor availability database",
    },
    {
      id: "bot-judging",
      name: "Send judging reminders",
      description: "Remind judges of schedule and submission review deadlines",
      trigger: "Scheduled before judging phase",
      action: "DM judges with review links and rubric",
      mockImplementation: "mockSendJudgingReminder(judgeId)",
      futureIntegration: "Discord API + judging platform integration",
    },
  ];
}

export function generateInitialCommunityHealth(
  expectedParticipants: number,
  announcementCount: number,
): CommunityHealth {
  return {
    memberCount: 0,
    unansweredQuestions: 0,
    activeTeams: 0,
    unassignedParticipants: expectedParticipants,
    mentorRequests: 0,
    moderationIncidents: 0,
    announcementQueue: announcementCount,
    submissionStatus: "not_started",
    communityRiskLevel: "low",
  };
}
