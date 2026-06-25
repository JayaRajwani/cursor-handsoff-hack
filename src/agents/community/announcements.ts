import type { CommunityAgentInput, AnnouncementTemplate, CommunityRule } from "./types.js";

export function generateCommunityRules(input: CommunityAgentInput): CommunityRule[] {
  return [
    {
      id: "rule-01",
      title: "Be Respectful",
      description: "Treat every participant, organiser, mentor, judge, and sponsor with respect. Disagreement is fine; personal attacks are not.",
      severity: "critical",
    },
    {
      id: "rule-02",
      title: "No Harassment",
      description: "Harassment of any kind — including unwelcome comments, intimidation, or sustained disruption — will result in immediate action.",
      severity: "critical",
    },
    {
      id: "rule-03",
      title: "No Spam",
      description: "Do not spam channels with repeated messages, unsolicited links, or off-topic promotion. Use the appropriate channel for your post.",
      severity: "warning",
    },
    {
      id: "rule-04",
      title: "No Unsafe Demos",
      description: "Do not demo or deploy projects that could cause harm, expose private data, or violate security best practices without explicit consent.",
      severity: "critical",
    },
    {
      id: "rule-05",
      title: "No Plagiarism",
      description: "All submissions must be original work created during the hackathon. Pre-existing code must be disclosed. Plagiarism leads to disqualification.",
      severity: "critical",
    },
    {
      id: "rule-06",
      title: "No Secret Recording",
      description: "Do not record sessions, conversations, or demos without explicit consent from all participants involved.",
      severity: "warning",
    },
    {
      id: "rule-07",
      title: "No Sponsor Harassment",
      description: "Sponsors are here to support you. Do not spam sponsors with unsolicited pitches or contact them outside designated channels.",
      severity: "warning",
    },
    {
      id: "rule-08",
      title: "No Discrimination",
      description: "We have zero tolerance for discrimination based on race, gender, sexuality, disability, religion, age, or any other characteristic.",
      severity: "critical",
    },
    {
      id: "rule-09",
      title: "Reporting Process",
      description: `If you experience or witness a violation, use \`/report\`, DM an @Moderator, or email ${input.emergencyContact ?? "organisers"}. All reports are handled confidentially.`,
      severity: "info",
    },
    {
      id: "rule-10",
      title: "Escalation Process",
      description: "Moderators issue warnings → mutes → removal. Serious violations escalate immediately to organisers via #incident-response. Safety concerns take priority over everything else.",
      severity: "info",
    },
  ];
}

export function generateAnnouncementTemplates(input: CommunityAgentInput): AnnouncementTemplate[] {
  const eventName = input.eventName;
  const schedule = input.schedule ?? {};

  return [
    {
      id: "ann-reg-open",
      type: "registration_open",
      title: "Registration Now Open!",
      content: `# 🎉 Registration is OPEN for ${eventName}!

We're looking for ${input.expectedParticipants} builders to join us in ${input.city || "London"}.

**Tracks:** ${input.tracks.join(" · ")}
**Duration:** ${input.duration}
**Register now:** [Registration Link]

Don't wait — spots fill fast! Join Discord after registering to start connecting with teammates.`,
      channels: ["announcements", "welcome"],
      schedule: schedule.registrationOpens,
    },
    {
      id: "ann-reg-closing",
      type: "registration_closing",
      title: "Registration Closing Soon",
      content: `# ⏰ Registration closes ${schedule.registrationCloses ?? "soon"}!

Last chance to join ${eventName}. ${input.expectedParticipants} spots — act now!

After registration closes, you'll receive venue details and final prep instructions.`,
      channels: ["announcements"],
      schedule: schedule.registrationCloses,
    },
    {
      id: "ann-venue",
      type: "venue_confirmed",
      title: "Venue Confirmed!",
      content: `# 📍 Venue Confirmed!

We're thrilled to announce our venue for ${eventName}. Details in #venue-info including directions, WiFi info, and what to bring.

See you there! 🚀`,
      channels: ["announcements", "venue-info"],
    },
    {
      id: "ann-schedule",
      type: "schedule_released",
      title: "Schedule Released",
      content: `# 📅 Full Schedule Released!

The complete ${eventName} schedule is now live in #schedule.

**Kickoff:** ${schedule.kickoff ?? "TBC"}
**Hacking ends:** ${schedule.hackingEnds ?? "TBC"}
**Judging:** ${schedule.judging ?? "TBC"}
**Awards:** ${schedule.awards ?? "TBC"}

Set your reminders!`,
      channels: ["announcements", "schedule"],
      schedule: schedule.kickoff,
    },
    {
      id: "ann-team-formation",
      type: "team_formation_reminder",
      title: "Team Formation Reminder",
      content: `# 👥 Time to Find Your Team for ${eventName}!

${input.teamFormationTiming === "before" ? "Teams are forming now" : "Team formation is open"} — head to:

• #find-a-team — general team matching
• #looking-for-developers — need coders?
• #looking-for-designers — need designers?
• #looking-for-researchers — need researchers?
• #project-ideas — share your ideas

Teams of 2-5 recommended. Solo submissions welcome too!`,
      channels: ["announcements", "find-a-team"],
    },
    {
      id: "ann-starting",
      type: "hackathon_starting",
      title: "Hackathon Starting NOW!",
      content: `# 🚀 ${eventName} IS LIVE!

Hacking has officially begun! You have ${input.duration} to build something amazing.

**Quick links:**
• #schedule — timeline
• #mentor-requests — get help
• #tech-help — technical issues
• #submissions — how to submit

Good luck, builders! 💪`,
      channels: ["announcements", "general"],
      schedule: schedule.kickoff,
    },
    {
      id: "ann-meal",
      type: "meal_announcement",
      title: "Meal Service",
      content: `# 🍕 Food is served at ${eventName}!

Meals are available at the venue dining area. Please bring your badge.

**Dietary requirements?** Let an organiser know if you haven't already.`,
      channels: ["announcements", "general"],
    },
    {
      id: "ann-mentors",
      type: "mentor_availability",
      title: "Mentors Available",
      content: `# 🧑‍🏫 Mentors are available at ${eventName}!

Our mentors are ready to help in #mentor-requests. Topics include:
• Architecture and system design
• ML/AI model selection
• UI/UX feedback
• Pitch preparation

Post your question with your track and what you need help with!`,
      channels: ["announcements", "mentor-requests"],
    },
    {
      id: "ann-submission",
      type: "submission_deadline",
      title: "Submission Deadline Approaching",
      content: `# ⚠️ SUBMISSION DEADLINE — ${eventName}: ${schedule.hackingEnds ?? "TBC"}

**${input.submissionProcess ?? "Submit via Devpost with repo link and demo video."}**

Checklist:
✅ GitHub repo (public)
✅ Demo video (max 3 min)
✅ Track selected
✅ Team members listed

Questions? #submissions or #ask-organisers`,
      channels: ["announcements", "submissions"],
      schedule: schedule.hackingEnds,
    },
    {
      id: "ann-judging",
      type: "judging_starting",
      title: "Judging Has Begun",
      content: `# ⚖️ Judging is now underway for ${eventName}

Thank you to all ${input.expectedParticipants} participants for an incredible ${input.duration} of building!

**Process:** ${input.judgingProcess ?? "Panel review across three rounds."}

Results will be announced at ${schedule.awards ?? "the awards ceremony"}. Good luck! 🍀`,
      channels: ["announcements"],
      schedule: schedule.judging,
    },
    {
      id: "ann-winners",
      type: "winners_announced",
      title: "Winners Announced!",
      content: `# 🏆 WINNERS ANNOUNCED!

Congratulations to all winners of ${eventName}!

Full results and project showcase coming to #wins.

Thank you to our sponsors: ${(input.sponsorNames ?? []).join(", ")}`,
      channels: ["announcements", "wins", "general"],
      schedule: schedule.awards,
    },
    {
      id: "ann-post-event",
      type: "post_event_followup",
      title: "Thank You & What's Next",
      content: `# 🙏 Thank You for an Amazing ${eventName}!

What happens next:
• **Feedback survey** — link coming soon
• **Project showcase** — #wins
• **Community stays open** — keep building together
• **Photos and recordings** — shared within 48 hours

Stay connected. The community doesn't end here! 🚀`,
      channels: ["announcements", "general"],
    },
  ];
}
