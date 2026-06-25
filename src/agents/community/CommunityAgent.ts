import { BaseAgent } from "../base/Agent.js";
import type { AgentPlan } from "../base/types.js";
import { generateServerPlan, generateServerChannels } from "./serverPlan.js";
import { getRoles, getPermissionRules } from "./roles.js";
import { generateWelcomeMessages } from "./welcome.js";
import { generateCommunityRules, generateAnnouncementTemplates } from "./announcements.js";
import { generateModerationWorkflow } from "./moderation.js";
import {
  generateBotAutomations,
  generateInitialCommunityHealth,
  MockDiscordClient,
} from "./mockDiscord.js";
import {
  generateWhatsAppPlan,
  generateWhatsAppAutomations,
  generateWhatsAppWelcomeMessage,
  MockWhatsAppClient,
} from "./whatsapp.js";
import type { CommunityAgentInput, CommunityAgentOutput } from "./types.js";

export class CommunityAgent extends BaseAgent<CommunityAgentInput, CommunityAgentOutput> {
  readonly name = "community-agent";
  readonly goal = "Create and manage the online community for the hackathon";

  private discordClient = new MockDiscordClient();
  private whatsappClient = new MockWhatsAppClient();

  async plan(input: CommunityAgentInput): Promise<AgentPlan> {
    this.status = "planning";
    this.input = input;
    this.log("plan_started", { eventName: input.eventName, platform: input.communityPlatform });

    this.currentPlan = {
      agentName: this.name,
      goal: this.goal,
      tasks: [
        {
          id: "server-structure",
          name: "Create Discord server structure",
          description: "Generate categories, channels, and track-specific channels",
          status: "pending",
          requiresApproval: true,
        },
        {
          id: "whatsapp-structure",
          name: "Create WhatsApp community structure",
          description: "Generate WhatsApp groups and broadcast templates mirroring Discord",
          status: "pending",
          requiresApproval: true,
        },
        {
          id: "roles-permissions",
          name: "Roles and permissions",
          description: "Define 13 roles with permission logic",
          status: "pending",
          requiresApproval: false,
        },
        {
          id: "welcome-flow",
          name: "Welcome flow",
          description: "Create onboarding messages and role selection prompts",
          status: "pending",
          requiresApproval: false,
        },
        {
          id: "rules-coc",
          name: "Rules and code of conduct",
          description: "Generate community rules with reporting and escalation",
          status: "pending",
          requiresApproval: true,
        },
        {
          id: "announcements",
          name: "Announcement system",
          description: "Create 12 announcement templates for event lifecycle",
          status: "pending",
          requiresApproval: true,
        },
        {
          id: "bots",
          name: "Bots and automations",
          description: "Design Discord + WhatsApp bot integration points with mock implementations",
          status: "pending",
          requiresApproval: false,
        },
        {
          id: "moderation",
          name: "Moderation workflow",
          description: "Define warning → mute → remove → escalate workflow",
          status: "pending",
          requiresApproval: false,
        },
        {
          id: "health",
          name: "Community health data",
          description: "Initialize operational health metrics",
          status: "pending",
          requiresApproval: false,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    this.status = "idle";
    this.log("plan_completed", { taskCount: this.currentPlan.tasks.length });
    return this.currentPlan;
  }

  async execute(): Promise<CommunityAgentOutput> {
    if (!this.input) {
      throw new Error("CommunityAgent: call plan() before execute()");
    }

    this.status = "executing";
    const input = this.input;

    try {
      this.updateTaskStatus("server-structure", "in_progress");
      const serverPlan = generateServerPlan(input);
      const channels = generateServerChannels(input);

      this.createApprovalRequest(
        "create_channels",
        `Create Discord server with ${channels.length} channels`,
        `Provision Discord server "${input.eventName}" with ${serverPlan.categories.length} categories`,
        channels.map((c) => `#${c.name}`),
        "Server structure must be reviewed before creation — affects all participant communication",
        { riskLevel: "medium" },
      );
      this.updateTaskStatus("server-structure", "completed");

      this.updateTaskStatus("roles-permissions", "in_progress");
      const roles = getRoles();
      const permissions = getPermissionRules();
      this.updateTaskStatus("roles-permissions", "completed");

      this.updateTaskStatus("welcome-flow", "in_progress");
      const welcomeMessages = generateWelcomeMessages(input);
      const whatsappEnabled = input.whatsappEnabled ?? true;
      if (whatsappEnabled) {
        welcomeMessages.push(generateWhatsAppWelcomeMessage(input));
      }
      this.updateTaskStatus("welcome-flow", "completed");

      this.updateTaskStatus("rules-coc", "in_progress");
      const rules = generateCommunityRules(input);

      this.createApprovalRequest(
        "publish_rules",
        "Publish community rules and code of conduct",
        "Post rules to #rules channel",
        ["rules", "welcome"],
        "Rules define community standards — must be approved before publishing",
        {
          draftContent: rules.map((r) => `**${r.title}:** ${r.description}`).join("\n\n"),
          riskLevel: "low",
        },
      );
      this.updateTaskStatus("rules-coc", "completed");

      this.updateTaskStatus("announcements", "in_progress");
      const announcementTemplates = generateAnnouncementTemplates(input);

      this.createApprovalRequest(
        "schedule_announcements",
        "Queue initial announcement templates",
        "Schedule registration open and welcome announcements",
        announcementTemplates.slice(0, 2).flatMap((a) => a.channels),
        "First announcements set the tone for the entire event community",
        {
          draftContent: announcementTemplates[0]?.content ?? "",
          riskLevel: "medium",
        },
      );
      this.updateTaskStatus("announcements", "completed");

      this.updateTaskStatus("whatsapp-structure", "in_progress");
      const whatsappPlan = generateWhatsAppPlan(input, announcementTemplates);
      if (whatsappEnabled) {
        this.createApprovalRequest(
          "create_whatsapp_broadcast",
          `Provision WhatsApp community with ${whatsappPlan.groups.length} groups and ${whatsappPlan.broadcastTemplates.length} broadcast templates`,
          `Create WhatsApp Community "${whatsappPlan.communityName}" and register ${whatsappPlan.broadcastTemplates.length} message templates with Meta`,
          whatsappPlan.groups.map((g) => g.name),
          "WhatsApp messaging reaches participants' personal phones and requires explicit opt-in — broadcasts and templates must be approved before sending",
          {
            draftContent: whatsappPlan.broadcastTemplates
              .map((t) => `[${t.category}] ${t.name}: ${t.body}`)
              .join("\n\n"),
            riskLevel: "high",
          },
        );
      }
      this.updateTaskStatus("whatsapp-structure", whatsappEnabled ? "completed" : "skipped");

      this.updateTaskStatus("bots", "in_progress");
      const botAutomations = [
        ...generateBotAutomations(),
        ...(whatsappEnabled ? generateWhatsAppAutomations() : []),
      ];
      this.updateTaskStatus("bots", "completed");

      this.updateTaskStatus("moderation", "in_progress");
      const moderationWorkflow = generateModerationWorkflow();
      this.updateTaskStatus("moderation", "completed");

      this.updateTaskStatus("health", "in_progress");
      const communityHealth = generateInitialCommunityHealth(
        input.expectedParticipants,
        announcementTemplates.length,
      );
      this.updateTaskStatus("health", "completed");

      if (this.context.mockMode) {
        await this.discordClient.createServer(input.eventName, serverPlan.description);
        if (whatsappEnabled) {
          await this.whatsappClient.createCommunity(
            whatsappPlan.communityName,
            whatsappPlan.description,
          );
        }
      }

      const nextActions = this.buildNextActions(
        channels.length,
        announcementTemplates.length,
        whatsappEnabled ? whatsappPlan : null,
      );

      const output: CommunityAgentOutput = {
        agent: "community-agent",
        status: this.hasPendingApprovals() ? "pending_approval" : "completed",
        serverPlan,
        whatsappPlan,
        channels,
        roles,
        permissions,
        welcomeMessages,
        rules,
        announcementTemplates,
        botAutomations,
        moderationWorkflow,
        communityHealth,
        nextActions,
        approvalRequired: this.hasPendingApprovals(),
      };

      this.output = output;
      this.status = output.status === "pending_approval" ? "pending_approval" : "completed";
      this.log("execution_completed", {
        status: output.status,
        channels: channels.length,
        roles: roles.length,
        whatsappGroups: whatsappEnabled ? whatsappPlan.groups.length : 0,
      });

      return output;
    } catch (error) {
      this.status = "failed";
      this.log("execution_failed", { error: String(error) });
      throw error;
    }
  }

  private buildNextActions(
    channelCount: number,
    announcementCount: number,
    whatsappPlan: { groups: { length: number }; broadcastTemplates: { length: number } } | null,
  ): string[] {
    const actions = [
      "Approve Discord server creation with channel structure",
      "Approve community rules before publishing to #rules",
      "Approve initial announcement templates (registration open)",
      `Configure ${channelCount} channels across 7 categories in Discord`,
      "Set up role selection bot with reaction roles",
      `Queue ${announcementCount} announcement templates in scheduling system`,
      "Recruit and assign 4-6 moderators before registration opens",
      "Connect Devpost submission webhook to #submissions bot",
      "Schedule welcome message sequence for server launch",
    ];
    if (whatsappPlan) {
      actions.push(
        `Approve WhatsApp community (${whatsappPlan.groups.length} groups) before provisioning`,
        `Register ${whatsappPlan.broadcastTemplates.length} WhatsApp templates with Meta for approval (24–48h lead time)`,
        "Add WhatsApp opt-in checkbox + number verification to the registration form",
      );
    }
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
