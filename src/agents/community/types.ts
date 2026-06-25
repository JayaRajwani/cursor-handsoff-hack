import type { EventBrief } from "../../orchestration/types.js";

export interface DiscordChannel {
  id: string;
  name: string;
  category: string;
  type: "text" | "voice" | "announcement" | "forum";
  topic?: string;
  private: boolean;
  allowedRoles?: string[];
}

export interface DiscordCategory {
  id: string;
  name: string;
  channels: string[];
}

export interface DiscordRole {
  id: string;
  name: string;
  color: string;
  hoist: boolean;
  mentionable: boolean;
  permissions: string[];
  description: string;
}

export interface PermissionRule {
  role: string;
  canAccess: string[];
  cannotAccess: string[];
  specialPermissions: string[];
}

export interface WelcomeMessage {
  channel: string;
  title: string;
  content: string;
  order: number;
}

export interface CommunityRule {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
}

export interface AnnouncementTemplate {
  id: string;
  type: string;
  title: string;
  content: string;
  channels: string[];
  schedule?: string;
}

export interface BotAutomation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  mockImplementation: string;
  futureIntegration: string;
}

export interface ModerationStep {
  id: string;
  action: string;
  description: string;
  executor: string[];
  escalation?: string;
  documentation: string;
}

export interface ModerationWorkflow {
  steps: ModerationStep[];
  incidentTypes: Record<string, string>;
  escalationPath: string[];
}

export interface CommunityHealth {
  memberCount: number;
  unansweredQuestions: number;
  activeTeams: number;
  unassignedParticipants: number;
  mentorRequests: number;
  moderationIncidents: number;
  announcementQueue: number;
  submissionStatus: string;
  communityRiskLevel: "low" | "medium" | "high";
}

export interface ServerPlan {
  name: string;
  description: string;
  categories: DiscordCategory[];
  totalChannels: number;
  totalRoles: number;
  platform: "Discord";
}

// --- WhatsApp (secondary community platform) ---

export type WhatsAppGroupType =
  | "announcement"
  | "discussion"
  | "track"
  | "support"
  | "private";

export interface WhatsAppGroup {
  id: string;
  name: string;
  type: WhatsAppGroupType;
  purpose: string;
  /** Announcement/broadcast groups restrict posting to admins only. */
  adminOnly: boolean;
  inviteVisibility: "public" | "approval" | "private";
  /** Roles permitted to join (private groups only). */
  allowedRoles?: string[];
  /** Discord channel this group mirrors, for cross-posting. */
  linkedDiscordChannel?: string;
  /** Soft cap; WhatsApp group hard limit is 1024 members. */
  memberCap: number;
}

/**
 * WhatsApp Business Cloud API requires pre-registered, pre-approved message
 * templates to notify users outside the 24-hour customer-service window.
 */
export interface WhatsAppBroadcastTemplate {
  id: string;
  /** Template name registered with Meta (snake_case). */
  name: string;
  category: "UTILITY" | "MARKETING";
  /** Maps to an AnnouncementTemplate.type so the two platforms stay in sync. */
  announcementType: string;
  language: string;
  /** Body copy with {{1}} positional placeholders, per WhatsApp template spec. */
  body: string;
  /** Human-readable description of each {{n}} variable, in order. */
  variables: string[];
  /** WhatsApp group ids this template broadcasts to. */
  targetGroups: string[];
  /** MARKETING templates require explicit prior opt-in; UTILITY is transactional. */
  requiresOptIn: boolean;
}

export interface WhatsAppPlan {
  platform: "WhatsApp";
  enabled: boolean;
  communityName: string;
  description: string;
  /** Default dialling region used to validate/format participant numbers. */
  defaultCountryCode: string;
  groups: WhatsAppGroup[];
  broadcastTemplates: WhatsAppBroadcastTemplate[];
  optInPolicy: string;
  totalGroups: number;
}

export interface CommunityAgentInput extends EventBrief {}

export interface CommunityAgentOutput {
  agent: "community-agent";
  status: "completed" | "pending_approval" | "needs_input" | "failed";
  serverPlan: ServerPlan;
  whatsappPlan: WhatsAppPlan;
  channels: DiscordChannel[];
  roles: DiscordRole[];
  permissions: PermissionRule[];
  welcomeMessages: WelcomeMessage[];
  rules: CommunityRule[];
  announcementTemplates: AnnouncementTemplate[];
  botAutomations: BotAutomation[];
  moderationWorkflow: ModerationWorkflow;
  communityHealth: CommunityHealth;
  nextActions: string[];
  approvalRequired: boolean;
}
