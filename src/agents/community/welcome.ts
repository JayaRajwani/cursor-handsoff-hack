import type { CommunityAgentInput, WelcomeMessage } from "./types.js";

export function generateWelcomeMessages(input: CommunityAgentInput): WelcomeMessage[] {
  const teamFormationNote =
    input.teamFormationTiming === "before"
      ? "Teams should already be forming — head to #find-a-team to connect with others."
      : input.teamFormationTiming === "during"
        ? "Team formation happens during the event — use #find-a-team and the role-specific channels to find your crew."
        : "You can form teams before or during the event — check #find-a-team for opportunities.";

  const beginnerNote = input.beginnerFriendly
    ? "\n\n🌱 **New to hackathons?** No worries — grab the @Beginner role and check #start-here for a guided walkthrough. Mentors are here to help!"
    : "";

  return [
    {
      channel: "welcome",
      title: `Welcome to ${input.eventName}!`,
      order: 1,
      content: `# Welcome to ${input.eventName}! 🚀

${input.eventDescription ?? input.goal}

**Dates:** ${input.schedule?.kickoff ?? "TBC"} — ${input.schedule?.awards ?? "TBC"}
**Platform:** Discord (you're in the right place!)
**Tracks:** ${input.tracks.join(" · ")}

This is your home base for the entire event. Let's build something extraordinary.`,
    },
    {
      channel: "start-here",
      title: "Start Here — Your First Steps",
      order: 2,
      content: `# Start Here 👋

Follow these steps to get set up:

1. **Read the rules** → #rules (required)
2. **Choose your roles** → React in #welcome or use \`/roles\` to pick Hacker, Developer, Designer, Researcher, or Beginner
3. **Introduce yourself** → #introduce-yourself (name, skills, what you want to build)
4. **Find a team** → #find-a-team ${input.teamFormationTiming === "before" ? "(teams forming now!)" : "(opens at kickoff)"}
5. **Review the schedule** → #schedule
6. **Know how to submit** → #submissions
7. **Need help?** → #ask-organisers or #tech-help

${teamFormationNote}${beginnerNote}`,
    },
    {
      channel: "introduce-yourself",
      title: "Introduce Yourself Template",
      order: 3,
      content: `# Introduce Yourself 🙋

Copy and fill in this template:

\`\`\`
Name:
Location:
Role/skill:
Track interest:
Looking for team: Yes/No
Fun fact:
What I want to build:
\`\`\`

Example:
> **Name:** Alex
> **Role:** Full-stack developer + ML enthusiast
> **Track:** AI Safety
> **Looking for team:** Yes — need a designer!
> **Fun fact:** I've never missed a hackathon meal 🍕`,
    },
    {
      channel: "welcome",
      title: "Role Selection Prompt",
      order: 4,
      content: `# Choose Your Roles 🏷️

React below or use \`/roles\` to assign yourself:

🛠️ @Hacker — General builder
💻 @Developer — Code-focused
🎨 @Designer — Design and UX
🔬 @Researcher — Research and ML
🌱 @Beginner — First hackathon? Welcome!
👥 @Team Lead — Leading a team

Your roles help others find you for team formation!`,
    },
    {
      channel: "welcome",
      title: "Code of Conduct Reminder",
      order: 5,
      content: `# Code of Conduct 📋

We're committed to a safe, inclusive, and respectful community.

**Full CoC:** ${input.codeOfConductUrl ?? "See #rules"}

**In short:** Be respectful. No harassment, discrimination, or spam. Report issues to moderators or use \`/report\`.

**Emergency contact:** ${input.emergencyContact ?? "Contact an @Organiser"}`,
    },
  ];
}
