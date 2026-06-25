import type { DiscordRole, PermissionRule } from "./types.js";

export const COMMUNITY_ROLES: DiscordRole[] = [
  {
    id: "role-organiser",
    name: "Organiser",
    color: "#E74C3C",
    hoist: true,
    mentionable: true,
    permissions: ["ADMINISTRATOR"],
    description: "Full server access. Event leadership and final decision authority.",
  },
  {
    id: "role-moderator",
    name: "Moderator",
    color: "#E67E22",
    hoist: true,
    mentionable: true,
    permissions: [
      "MANAGE_MESSAGES",
      "KICK_MEMBERS",
      "MUTE_MEMBERS",
      "MANAGE_THREADS",
      "VIEW_AUDIT_LOG",
    ],
    description: "Community moderation, message management, and incident first response.",
  },
  {
    id: "role-mentor",
    name: "Mentor",
    color: "#3498DB",
    hoist: true,
    mentionable: true,
    permissions: ["SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "USE_EXTERNAL_EMOJIS"],
    description: "Technical mentors available for office hours and team support.",
  },
  {
    id: "role-judge",
    name: "Judge",
    color: "#9B59B6",
    hoist: true,
    mentionable: false,
    permissions: ["SEND_MESSAGES", "EMBED_LINKS", "READ_MESSAGE_HISTORY"],
    description: "Judging panel members with access to judging channels.",
  },
  {
    id: "role-sponsor",
    name: "Sponsor",
    color: "#F1C40F",
    hoist: true,
    mentionable: false,
    permissions: ["SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"],
    description: "Event sponsors with access to sponsor channels and public areas.",
  },
  {
    id: "role-hacker",
    name: "Hacker",
    color: "#2ECC71",
    hoist: false,
    mentionable: false,
    permissions: ["SEND_MESSAGES", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS"],
    description: "General participant role for hackathon builders.",
  },
  {
    id: "role-designer",
    name: "Designer",
    color: "#1ABC9C",
    hoist: false,
    mentionable: false,
    permissions: ["SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS"],
    description: "Participants specialising in design and UX.",
  },
  {
    id: "role-developer",
    name: "Developer",
    color: "#27AE60",
    hoist: false,
    mentionable: false,
    permissions: ["SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS"],
    description: "Participants specialising in software development.",
  },
  {
    id: "role-researcher",
    name: "Researcher",
    color: "#8E44AD",
    hoist: false,
    mentionable: false,
    permissions: ["SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS"],
    description: "Participants specialising in research and ML/AI.",
  },
  {
    id: "role-beginner",
    name: "Beginner",
    color: "#95A5A6",
    hoist: false,
    mentionable: false,
    permissions: ["SEND_MESSAGES", "ADD_REACTIONS"],
    description: "First-time hackathon participants — extra support available.",
  },
  {
    id: "role-team-lead",
    name: "Team Lead",
    color: "#E84393",
    hoist: false,
    mentionable: false,
    permissions: ["SEND_MESSAGES", "CREATE_PUBLIC_THREADS", "MANAGE_THREADS"],
    description: "Team leaders coordinating project submissions.",
  },
  {
    id: "role-volunteer",
    name: "Volunteer",
    color: "#636E72",
    hoist: false,
    mentionable: false,
    permissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    description: "Event volunteers assisting with logistics and support.",
  },
];

export const PERMISSION_RULES: PermissionRule[] = [
  {
    role: "Organiser",
    canAccess: ["ALL_CHANNELS"],
    cannotAccess: [],
    specialPermissions: ["Full admin", "Manage all roles", "Override moderation"],
  },
  {
    role: "Moderator",
    canAccess: [
      "ALL_PUBLIC_CHANNELS",
      "organisers",
      "incident-response",
      "mentors",
    ],
    cannotAccess: ["judges (deliberation phase)", "sponsors (private planning)"],
    specialPermissions: ["Remove messages", "Mute/kick members", "Create incident reports"],
  },
  {
    role: "Judge",
    canAccess: [
      "ALL_PUBLIC_CHANNELS",
      "judging",
      "judges",
      "submissions",
    ],
    cannotAccess: ["organisers", "incident-response", "sponsors"],
    specialPermissions: ["View submission details", "Access judging rubric"],
  },
  {
    role: "Sponsor",
    canAccess: [
      "ALL_PUBLIC_CHANNELS",
      "sponsors",
      "sponsor-office-hours",
    ],
    cannotAccess: ["organisers", "judges", "incident-response", "mentors"],
    specialPermissions: ["Host office hours", "Post in sponsor channels"],
  },
  {
    role: "Mentor",
    canAccess: [
      "ALL_PUBLIC_CHANNELS",
      "mentors",
      "mentor-requests",
    ],
    cannotAccess: ["organisers", "judges", "incident-response", "sponsors"],
    specialPermissions: ["Respond to mentor requests", "Access mentor coordination"],
  },
  {
    role: "Hacker",
    canAccess: ["ALL_PUBLIC_CHANNELS"],
    cannotAccess: ["organisers", "judges", "mentors", "sponsors", "incident-response"],
    specialPermissions: ["Post in team formation", "Submit projects"],
  },
  {
    role: "Designer",
    canAccess: ["ALL_PUBLIC_CHANNELS", "looking-for-designers"],
    cannotAccess: ["organisers", "judges", "mentors", "sponsors", "incident-response"],
    specialPermissions: ["Self-assign via role selection bot"],
  },
  {
    role: "Developer",
    canAccess: ["ALL_PUBLIC_CHANNELS", "looking-for-developers"],
    cannotAccess: ["organisers", "judges", "mentors", "sponsors", "incident-response"],
    specialPermissions: ["Self-assign via role selection bot"],
  },
  {
    role: "Researcher",
    canAccess: ["ALL_PUBLIC_CHANNELS", "looking-for-researchers"],
    cannotAccess: ["organisers", "judges", "mentors", "sponsors", "incident-response"],
    specialPermissions: ["Self-assign via role selection bot"],
  },
  {
    role: "Beginner",
    canAccess: ["ALL_PUBLIC_CHANNELS"],
    cannotAccess: ["organisers", "judges", "mentors", "sponsors", "incident-response"],
    specialPermissions: ["Access beginner resources in start-here"],
  },
  {
    role: "Team Lead",
    canAccess: ["ALL_PUBLIC_CHANNELS"],
    cannotAccess: ["organisers", "judges", "mentors", "sponsors", "incident-response"],
    specialPermissions: ["Manage team threads", "Submit on behalf of team"],
  },
  {
    role: "Volunteer",
    canAccess: ["ALL_PUBLIC_CHANNELS", "ask-organisers"],
    cannotAccess: ["organisers", "judges", "mentors", "sponsors", "incident-response"],
    specialPermissions: ["Assist in support channels"],
  },
];

export function getRoles(): DiscordRole[] {
  return COMMUNITY_ROLES;
}

export function getPermissionRules(): PermissionRule[] {
  return PERMISSION_RULES;
}

export function canRoleAccessChannel(role: string, channel: string): boolean {
  const rule = PERMISSION_RULES.find((r) => r.role === role);
  if (!rule) return false;

  if (rule.canAccess.includes("ALL_CHANNELS")) return true;
  if (rule.canAccess.includes("ALL_PUBLIC_CHANNELS") && !channel.startsWith("PRIVATE")) {
    const privateChannels = ["organisers", "judges", "mentors", "sponsors", "incident-response"];
    return !privateChannels.includes(channel) || rule.canAccess.includes(channel);
  }

  return rule.canAccess.includes(channel);
}
