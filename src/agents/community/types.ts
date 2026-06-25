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

export interface CommunityAgentInput extends EventBrief {}

export interface CommunityAgentOutput {
  agent: "community-agent";
  status: "completed" | "pending_approval" | "needs_input" | "failed";
  serverPlan: ServerPlan;
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
