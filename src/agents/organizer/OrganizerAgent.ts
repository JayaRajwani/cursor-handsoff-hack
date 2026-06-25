import OpenAI from "openai";
import type { EventBrief } from "../../orchestration/types.js";
import type { SponsorLead } from "../sponsorship/types.js";

export interface OrganizerOutput {
  eventConcept: {
    name: string;
    tagline: string;
    audience: string;
    format: string;
    duration: string;
    differentiator: string;
  };
  themes: string[];
  tracks: Array<{ name: string; description: string; exampleProjects: string[] }>;
  websiteContent: {
    heroHeadline: string;
    heroSubheadline: string;
    about: string;
    whyAttend: string[];
    scheduleHighlights: string[];
    faq: Array<{ question: string; answer: string }>;
  };
  launchPost: { channel: string; copy: string; hashtags: string[] };
  applicationFlow: { steps: string[]; formFields: string[]; screeningCriteria: string[] };
  submissionFlow: { steps: string[]; requiredArtifacts: string[]; deadlineGuidance: string };
  judgingPreEvaluation: {
    rubric: Array<{ criterion: string; weight: number; description: string }>;
    preScreeningChecks: string[];
  };
  organizerChecklist: Array<{ phase: string; tasks: string[] }>;
  delegationContext: { futureAgents: string[]; handoffNotes: string[]; risks: string[] };
  sponsorshipBrief: {
    fundraisingGoal: number;
    currency: "GBP" | "USD" | "EUR";
    packages: Array<{ name: string; amount: number; benefits: string[] }>;
    leads: SponsorLead[];
    outreachAngles: string[];
  };
}

export interface OrganizerRunResult {
  data: OrganizerOutput;
  source: "openai" | "mock";
  error?: string;
}

export async function runOrganizerAgent(goal: string): Promise<OrganizerRunResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { data: createMockOrganizerOutput(goal), source: "mock", error: "OPENAI_API_KEY is not configured." };
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are the Main Organizer Agent for HackOS. Return only valid JSON. Keep all arrays non-empty and use GBP, USD, or EUR for sponsorshipBrief.currency.",
        },
        {
          role: "user",
          content: `Create a complete hackathon operating plan for this goal: ${goal}

Return JSON with exactly these top-level keys:
eventConcept, themes, tracks, websiteContent, launchPost, applicationFlow,
submissionFlow, judgingPreEvaluation, organizerChecklist, delegationContext,
sponsorshipBrief.

sponsorshipBrief.leads must contain 2 verbally_committed sponsor leads with:
sponsorId, sponsorName, contactName, contactEmail, packageName, amount, currency, stage.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned an empty organizer response.");

    return { data: normalizeOrganizerOutput(JSON.parse(content), goal), source: "openai" };
  } catch (error) {
    return {
      data: createMockOrganizerOutput(goal),
      source: "mock",
      error: error instanceof Error ? error.message : "Unknown OpenAI organizer error.",
    };
  }
}

export function organizerToEventBrief(goal: string, organizer: OrganizerOutput): EventBrief {
  const tracks = organizer.tracks.map((track) => track.name).slice(0, 6);

  return {
    eventName: organizer.eventConcept.name,
    goal,
    city: "London",
    expectedParticipants: 300,
    expectedOrganisers: 12,
    expectedJudgesAndMentors: 24,
    duration: organizer.eventConcept.duration || "48 hours",
    budget: { venue: 25000, total: 75000 },
    tracks: tracks.length > 0 ? tracks : ["AI Operations", "Builder Tools", "Community"],
    requiresOvernightAccess: true,
    requiresStrongWifi: true,
    communityPlatform: "Discord",
    secondaryCommunityPlatforms: ["WhatsApp"],
    whatsappEnabled: process.env.WHATSAPP_MODE !== "off",
    whatsappCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? "+44",
    tone: "ambitious, practical, founder-friendly",
    eventDescription: organizer.websiteContent.about,
    participantTypes: ["builders", "founders", "designers", "students", "mentors", "sponsors"],
    submissionProcess: organizer.submissionFlow.steps.join(" "),
    judgingProcess: organizer.judgingPreEvaluation.rubric
      .map((item) => `${item.criterion}: ${item.weight}%`)
      .join("; "),
    sponsorNames: organizer.sponsorshipBrief.leads.map((lead) => lead.sponsorName),
  };
}

function normalizeOrganizerOutput(value: unknown, goal: string): OrganizerOutput {
  const fallback = createMockOrganizerOutput(goal);
  if (!isRecord(value)) return fallback;

  return {
    ...fallback,
    ...value,
    eventConcept: { ...fallback.eventConcept, ...(isRecord(value.eventConcept) ? value.eventConcept : {}) },
    themes: normalizeStringArray(value.themes, fallback.themes),
    tracks: normalizeTracks(value.tracks, fallback.tracks),
    websiteContent: { ...fallback.websiteContent, ...(isRecord(value.websiteContent) ? value.websiteContent : {}) },
    launchPost: { ...fallback.launchPost, ...(isRecord(value.launchPost) ? value.launchPost : {}) },
    applicationFlow: { ...fallback.applicationFlow, ...(isRecord(value.applicationFlow) ? value.applicationFlow : {}) },
    submissionFlow: { ...fallback.submissionFlow, ...(isRecord(value.submissionFlow) ? value.submissionFlow : {}) },
    judgingPreEvaluation: {
      ...fallback.judgingPreEvaluation,
      ...(isRecord(value.judgingPreEvaluation) ? value.judgingPreEvaluation : {}),
    },
    delegationContext: {
      ...fallback.delegationContext,
      ...(isRecord(value.delegationContext) ? value.delegationContext : {}),
    },
    sponsorshipBrief: normalizeSponsorshipBrief(value.sponsorshipBrief, fallback.sponsorshipBrief),
  };
}

function normalizeTracks(value: unknown, fallback: OrganizerOutput["tracks"]): OrganizerOutput["tracks"] {
  if (!Array.isArray(value)) return fallback;
  const tracks = value
    .map((track) => {
      if (typeof track === "string") {
        return { name: track, description: `${track} projects and demos.`, exampleProjects: [`${track} assistant`] };
      }
      if (isRecord(track) && typeof track.name === "string") {
        return {
          name: track.name,
          description: typeof track.description === "string" ? track.description : `${track.name} projects and demos.`,
          exampleProjects: normalizeStringArray(track.exampleProjects, [`${track.name} assistant`]),
        };
      }
      return null;
    })
    .filter((track): track is OrganizerOutput["tracks"][number] => track !== null);

  return tracks.length > 0 ? tracks : fallback;
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const strings = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return strings.length > 0 ? strings : fallback;
}

function normalizeSponsorshipBrief(value: unknown, fallback: OrganizerOutput["sponsorshipBrief"]): OrganizerOutput["sponsorshipBrief"] {
  if (!isRecord(value)) return fallback;
  const leads = Array.isArray(value.leads) ? value.leads : fallback.leads;
  const currency = value.currency === "USD" || value.currency === "EUR" || value.currency === "GBP" ? value.currency : "GBP";

  return {
    fundraisingGoal:
      typeof value.fundraisingGoal === "number" && value.fundraisingGoal > 0
        ? value.fundraisingGoal
        : fallback.fundraisingGoal,
    currency,
    packages: Array.isArray(value.packages) ? (value.packages as OrganizerOutput["sponsorshipBrief"]["packages"]) : fallback.packages,
    leads: leads.map((lead, index) => normalizeSponsorLead(lead, fallback.leads[index] ?? fallback.leads[0]!)),
    outreachAngles: Array.isArray(value.outreachAngles) ? (value.outreachAngles as string[]) : fallback.outreachAngles,
  };
}

function normalizeSponsorLead(value: unknown, fallback: SponsorLead): SponsorLead {
  if (!isRecord(value)) return fallback;
  const currency = value.currency === "USD" || value.currency === "EUR" || value.currency === "GBP" ? value.currency : fallback.currency;

  return {
    sponsorId: typeof value.sponsorId === "string" ? value.sponsorId : fallback.sponsorId,
    sponsorName: typeof value.sponsorName === "string" ? value.sponsorName : fallback.sponsorName,
    contactName: typeof value.contactName === "string" ? value.contactName : fallback.contactName,
    contactEmail: typeof value.contactEmail === "string" ? value.contactEmail : fallback.contactEmail,
    packageName: typeof value.packageName === "string" ? value.packageName : fallback.packageName,
    amount: typeof value.amount === "number" && value.amount > 0 ? value.amount : fallback.amount,
    currency,
    stage: "verbally_committed",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createMockOrganizerOutput(goal: string): OrganizerOutput {
  return {
    eventConcept: {
      name: "HackOS Launch Sprint",
      tagline: "Build the operating system for ambitious hackathons.",
      audience: "AI builders, product-minded engineers, student founders, and organizer teams",
      format: "Hybrid weekend hackathon with async prep and live demo day",
      duration: "48 hours",
      differentiator: `Focused around: ${goal}`,
    },
    themes: ["AI for operations", "Community tooling", "Future of work", "Responsible automation"],
    tracks: [
      {
        name: "Organizer Automation",
        description: "Tools that reduce manual coordination work before, during, and after the event.",
        exampleProjects: ["AI volunteer scheduler", "Participant support copilot"],
      },
      {
        name: "Sponsor Intelligence",
        description: "Systems that help teams match hackathon outcomes with sponsor objectives.",
        exampleProjects: ["Sponsor-fit scoring engine", "Personalized outreach writer"],
      },
      {
        name: "Builder Experience",
        description: "Products that make team formation, submissions, and judging easier for participants.",
        exampleProjects: ["Team matching board", "Submission quality checker"],
      },
    ],
    websiteContent: {
      heroHeadline: "Organize a sharper AI hackathon from concept to final demos.",
      heroSubheadline:
        "HackOS turns a rough event goal into tracks, content, applications, judging flows, and sponsor strategy.",
      about:
        "A high-signal hackathon for builders who want to create practical AI systems that help organizers run better events.",
      whyAttend: [
        "Work on operationally useful AI products",
        "Meet other builders who understand events and automation",
        "Get clear judging criteria and sponsor-facing feedback",
      ],
      scheduleHighlights: [
        "Applications and team formation open two weeks before kickoff",
        "Live kickoff introduces tracks, mentors, and judging rubric",
        "Final showcase includes demos, sponsor feedback, and winner announcements",
      ],
      faq: [
        { question: "Who should apply?", answer: "Builders, designers, operators, and students." },
        { question: "Do I need a team?", answer: "No. Solo builders are welcome." },
        { question: "What should teams submit?", answer: "A demo, project summary, and repo or build notes." },
      ],
    },
    launchPost: {
      channel: "LinkedIn",
      copy:
        "We are launching HackOS: a focused AI hackathon for builders creating the operating system for better hackathons.",
      hashtags: ["#Hackathon", "#AI", "#Builders", "#Startups"],
    },
    applicationFlow: {
      steps: ["Collect profile", "Ask preferred tracks", "Screen for motivation", "Confirm acceptance"],
      formFields: ["Name", "Email", "Timezone", "Skills", "Portfolio", "Preferred track", "Motivation"],
      screeningCriteria: ["Core sprint availability", "Credible build signal", "Theme alignment"],
    },
    submissionFlow: {
      steps: ["Open submissions", "Send deadline reminders", "Run completeness checks", "Route to judges"],
      requiredArtifacts: ["Demo link", "Project summary", "Repo or technical notes", "Team details"],
      deadlineGuidance: "Close submissions two hours before judging so organizers can review completeness.",
    },
    judgingPreEvaluation: {
      rubric: [
        { criterion: "Problem clarity", weight: 20, description: "The project solves a real operations problem." },
        { criterion: "Execution quality", weight: 30, description: "The demo works and the approach is credible." },
        { criterion: "User value", weight: 25, description: "The solution saves time or improves quality." },
        { criterion: "Sponsor relevance", weight: 15, description: "The outcome creates a sponsor story." },
        { criterion: "Responsible design", weight: 10, description: "The team considered safety and privacy." },
      ],
      preScreeningChecks: ["Artifacts complete", "Demo accessible", "Aligned to at least one track"],
    },
    organizerChecklist: [
      { phase: "Planning", tasks: ["Lock positioning", "Confirm rubric", "Draft sponsor list"] },
      { phase: "Launch", tasks: ["Publish landing page", "Post announcement", "Open applications"] },
      { phase: "Sprint", tasks: ["Run kickoff", "Monitor questions", "Send deadline reminders"] },
      { phase: "Judging", tasks: ["Check submissions", "Assign judges", "Prepare finalist run-of-show"] },
    ],
    delegationContext: {
      futureAgents: ["Marketing Agent", "Logistics Agent", "Judging Agent", "Participant Support Agent"],
      handoffNotes: [
        "Marketing should reuse the event concept and launch post",
        "Logistics should turn the checklist into dated milestones",
        "Judging should expand the rubric into scorecards",
      ],
      risks: [
        "Sponsor value proposition needs focus",
        "Hybrid format needs timezone planning",
        "Submission quality depends on guidance",
      ],
    },
    sponsorshipBrief: {
      fundraisingGoal: 30000,
      currency: "GBP",
      packages: [
        { name: "Community Sponsor", amount: 5000, benefits: ["Logo", "Recap mention", "Community access"] },
        { name: "Track Sponsor", amount: 10000, benefits: ["Named track", "Judge seat", "Mentor session"] },
        { name: "Title Sponsor", amount: 25000, benefits: ["Top billing", "Keynote slot", "Custom challenge"] },
      ],
      leads: [
        {
          sponsorId: "sponsor_supabase",
          sponsorName: "Supabase",
          contactName: "Partnerships Team",
          contactEmail: "partnerships@supabase.com",
          packageName: "Track Sponsor",
          amount: 10000,
          currency: "GBP",
          stage: "verbally_committed",
        },
        {
          sponsorId: "sponsor_vercel",
          sponsorName: "Vercel",
          contactName: "Developer Relations",
          contactEmail: "devrel@vercel.com",
          packageName: "Community Sponsor",
          amount: 5000,
          currency: "GBP",
          stage: "verbally_committed",
        },
      ],
      outreachAngles: [
        "Builder adoption and product feedback",
        "High-signal demo content",
        "Direct association with AI operations tooling",
      ],
    },
  };
}
