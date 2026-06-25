import type { ModerationWorkflow } from "./types.js";

export function generateModerationWorkflow(): ModerationWorkflow {
  return {
    steps: [
      {
        id: "mod-warn",
        action: "warning",
        description: "Issue a formal warning for first-time or minor violations. Document in incident log.",
        executor: ["Moderator", "Organiser"],
        escalation: "Repeat violations → mute",
        documentation: "Log warning in #incident-response with user ID, channel, reason, and timestamp.",
      },
      {
        id: "mod-mute",
        action: "muting",
        description: "Temporarily mute user (1h–24h) for repeated minor violations or moderate single violations.",
        executor: ["Moderator", "Organiser"],
        escalation: "Continued violation while muted → remove",
        documentation: "Record mute duration, reason, and prior warning reference.",
      },
      {
        id: "mod-remove",
        action: "removing",
        description: "Remove user from server for serious or repeated violations. Ban if necessary.",
        executor: ["Moderator", "Organiser"],
        escalation: "Organiser review within 1 hour",
        documentation: "Full incident report required before removal. Capture message screenshots.",
      },
      {
        id: "mod-escalate",
        action: "escalating to organiser",
        description: "Escalate complex cases to organisers via #incident-response for decision.",
        executor: ["Moderator"],
        escalation: "Organiser → emergency contact if safety concern",
        documentation: "Escalation ticket with full context, screenshots, and recommended action.",
      },
      {
        id: "mod-incident",
        action: "incident report creation",
        description: "Create structured incident report for any moderation action or reported violation.",
        executor: ["Moderator", "Organiser"],
        documentation: "Use /incident command: reporter, subject, channel, description, severity, action taken.",
      },
      {
        id: "mod-review",
        action: "private organiser review",
        description: "Organisers review all high-severity incidents privately before public communication.",
        executor: ["Organiser"],
        documentation: "Review within 30 minutes for critical; 4 hours for high severity.",
      },
      {
        id: "mod-sponsor",
        action: "sponsor or judge issue",
        description: "Handle reports involving sponsors or judges with extra sensitivity and organiser-only review.",
        executor: ["Organiser"],
        escalation: "External liaison if sponsor relationship affected",
        documentation: "Confidential report. Do not discuss in public channels.",
      },
      {
        id: "mod-safety",
        action: "participant safety concern",
        description: "Immediate response for safety concerns including harassment, threats, or medical emergencies.",
        executor: ["Organiser", "Moderator"],
        escalation: `Emergency contact immediately. Venue security if on-site.`,
        documentation: "Priority 1. Pause moderation discussion until safety is addressed.",
      },
    ],
    incidentTypes: {
      harassment: "mod-safety",
      spam: "mod-warn",
      plagiarism: "mod-escalate",
      unsafe_demo: "mod-remove",
      discrimination: "mod-safety",
      sponsor_issue: "mod-sponsor",
      judge_issue: "mod-sponsor",
      safety: "mod-safety",
      general: "mod-warn",
    },
    escalationPath: [
      "Moderator warning",
      "Moderator mute",
      "Organiser review (#incident-response)",
      "Removal / ban",
      "Emergency contact (safety)",
    ],
  };
}
