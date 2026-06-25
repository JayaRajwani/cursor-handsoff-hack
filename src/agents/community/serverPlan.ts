import type { CommunityAgentInput, DiscordCategory, DiscordChannel, ServerPlan } from "./types.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const STANDARD_CHANNELS: Array<Omit<DiscordChannel, "id">> = [
  { name: "welcome", category: "WELCOME", type: "announcement", topic: "Official welcome — read-only", private: false },
  { name: "rules", category: "WELCOME", type: "text", topic: "Community rules and code of conduct", private: false },
  { name: "announcements", category: "WELCOME", type: "announcement", topic: "Official event announcements", private: false },
  { name: "start-here", category: "WELCOME", type: "text", topic: "New here? Start with this guide", private: false },
  { name: "introduce-yourself", category: "WELCOME", type: "text", topic: "Tell us about yourself and your skills", private: false },

  { name: "schedule", category: "EVENT INFO", type: "announcement", topic: "Event schedule and timeline", private: false },
  { name: "venue-info", category: "EVENT INFO", type: "text", topic: "Venue details, directions, and logistics", private: false },
  { name: "faq", category: "EVENT INFO", type: "text", topic: "Frequently asked questions", private: false },
  { name: "judging", category: "EVENT INFO", type: "text", topic: "Judging criteria and process", private: false },
  { name: "submissions", category: "EVENT INFO", type: "text", topic: "How to submit your project", private: false },
  { name: "prizes", category: "EVENT INFO", type: "text", topic: "Prizes and sponsor awards", private: false },

  { name: "find-a-team", category: "TEAM FORMATION", type: "forum", topic: "Looking for teammates? Post here", private: false },
  { name: "project-ideas", category: "TEAM FORMATION", type: "text", topic: "Share and discover project ideas", private: false },
  { name: "looking-for-designers", category: "TEAM FORMATION", type: "text", topic: "Teams seeking designers", private: false },
  { name: "looking-for-developers", category: "TEAM FORMATION", type: "text", topic: "Teams seeking developers", private: false },
  { name: "looking-for-researchers", category: "TEAM FORMATION", type: "text", topic: "Teams seeking researchers", private: false },

  { name: "ask-organisers", category: "SUPPORT", type: "text", topic: "Questions for the organising team", private: false },
  { name: "tech-help", category: "SUPPORT", type: "text", topic: "Technical issues and setup help", private: false },
  { name: "mentor-requests", category: "SUPPORT", type: "text", topic: "Request a mentor session", private: false },
  { name: "sponsor-office-hours", category: "SUPPORT", type: "text", topic: "Book time with sponsors", private: false },

  { name: "general", category: "COMMUNITY", type: "text", topic: "General chat and event discussion", private: false },
  { name: "wins", category: "COMMUNITY", type: "text", topic: "Celebrate milestones and breakthroughs", private: false },
  { name: "memes", category: "COMMUNITY", type: "text", topic: "Light-hearted fun (keep it respectful)", private: false },
  { name: "resources", category: "COMMUNITY", type: "text", topic: "Useful links, APIs, and tools", private: false },

  { name: "organisers", category: "PRIVATE", type: "text", topic: "Organiser planning and coordination", private: true, allowedRoles: ["Organiser", "Moderator"] },
  { name: "judges", category: "PRIVATE", type: "text", topic: "Judge coordination and deliberation", private: true, allowedRoles: ["Organiser", "Judge"] },
  { name: "mentors", category: "PRIVATE", type: "text", topic: "Mentor coordination", private: true, allowedRoles: ["Organiser", "Moderator", "Mentor"] },
  { name: "sponsors", category: "PRIVATE", type: "text", topic: "Sponsor coordination", private: true, allowedRoles: ["Organiser", "Sponsor"] },
  { name: "incident-response", category: "PRIVATE", type: "text", topic: "Safety incidents and moderation escalation", private: true, allowedRoles: ["Organiser", "Moderator"] },
];

export function generateTrackChannels(tracks: string[]): DiscordChannel[] {
  return tracks.map((track) => ({
    id: `ch-track-${slugify(track)}`,
    name: `track-${slugify(track)}`,
    category: "TRACKS",
    type: "text" as const,
    topic: `Discussion and updates for the ${track} track`,
    private: false,
  }));
}

export function generateServerChannels(input: CommunityAgentInput): DiscordChannel[] {
  const standardChannels: DiscordChannel[] = STANDARD_CHANNELS.map((ch) => ({
    ...ch,
    id: `ch-${ch.name}`,
  }));

  const trackChannels = generateTrackChannels(input.tracks);

  return [...standardChannels, ...trackChannels];
}

export function generateServerPlan(input: CommunityAgentInput): ServerPlan {
  const channels = generateServerChannels(input);

  const categoryNames = ["WELCOME", "EVENT INFO", "TEAM FORMATION", "TRACKS", "SUPPORT", "COMMUNITY", "PRIVATE"];
  const categories: DiscordCategory[] = categoryNames.map((name) => ({
    id: `cat-${slugify(name)}`,
    name,
    channels: channels.filter((c) => c.category === name).map((c) => c.id),
  }));

  return {
    name: input.eventName,
    description: input.eventDescription ?? input.goal,
    categories,
    totalChannels: channels.length,
    totalRoles: 13,
    platform: "Discord",
  };
}
