import OpenAI from "openai";
import type { AgentRunResult, OrganizerOutput } from "./organizerAgent.js";

export type SponsorshipOutput = {
  sponsorshipPackages: Array<{
    name: string;
    price: number;
    benefits: string[];
    idealSponsorProfile: string;
  }>;
  sponsorDiscovery: Array<{
    segment: string;
    targetCompanies: string[];
    rationale: string;
  }>;
  personalizedOutreach: Array<{
    sponsorName: string;
    subject: string;
    message: string;
    personalizationAngle: string;
  }>;
  pipeline: Array<{
    stage: string;
    actions: string[];
    exitCriteria: string;
  }>;
  expectedSponsorshipValues: {
    conservative: number;
    expected: number;
    stretch: number;
    assumptions: string[];
  };
  negotiationStrategy: {
    anchors: string[];
    concessions: string[];
    redLines: string[];
    followUpCadence: string[];
  };
};

const sponsorshipSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "sponsorshipPackages",
    "sponsorDiscovery",
    "personalizedOutreach",
    "pipeline",
    "expectedSponsorshipValues",
    "negotiationStrategy"
  ],
  properties: {
    sponsorshipPackages: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "price", "benefits", "idealSponsorProfile"],
        properties: {
          name: { type: "string" },
          price: { type: "number" },
          benefits: { type: "array", items: { type: "string" }, minItems: 3 },
          idealSponsorProfile: { type: "string" }
        }
      }
    },
    sponsorDiscovery: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["segment", "targetCompanies", "rationale"],
        properties: {
          segment: { type: "string" },
          targetCompanies: { type: "array", items: { type: "string" }, minItems: 3 },
          rationale: { type: "string" }
        }
      }
    },
    personalizedOutreach: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sponsorName", "subject", "message", "personalizationAngle"],
        properties: {
          sponsorName: { type: "string" },
          subject: { type: "string" },
          message: { type: "string" },
          personalizationAngle: { type: "string" }
        }
      }
    },
    pipeline: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["stage", "actions", "exitCriteria"],
        properties: {
          stage: { type: "string" },
          actions: { type: "array", items: { type: "string" }, minItems: 2 },
          exitCriteria: { type: "string" }
        }
      }
    },
    expectedSponsorshipValues: {
      type: "object",
      additionalProperties: false,
      required: ["conservative", "expected", "stretch", "assumptions"],
      properties: {
        conservative: { type: "number" },
        expected: { type: "number" },
        stretch: { type: "number" },
        assumptions: { type: "array", items: { type: "string" }, minItems: 3 }
      }
    },
    negotiationStrategy: {
      type: "object",
      additionalProperties: false,
      required: ["anchors", "concessions", "redLines", "followUpCadence"],
      properties: {
        anchors: { type: "array", items: { type: "string" }, minItems: 3 },
        concessions: { type: "array", items: { type: "string" }, minItems: 3 },
        redLines: { type: "array", items: { type: "string" }, minItems: 3 },
        followUpCadence: { type: "array", items: { type: "string" }, minItems: 3 }
      }
    }
  }
} as const;

export async function runSponsorshipAgent(
  goal: string,
  organizerOutput: OrganizerOutput
): Promise<AgentRunResult<SponsorshipOutput>> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      data: createMockSponsorshipOutput(goal, organizerOutput),
      source: "mock",
      error: "OPENAI_API_KEY is not configured."
    };
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are the Sponsorship Agent for HackOS. Use the organizer output as context and return only valid JSON matching the provided schema."
        },
        {
          role: "user",
          content: JSON.stringify({
            goal,
            organizerOutput
          })
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sponsorship_output",
          strict: true,
          schema: sponsorshipSchema
        }
      }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned an empty sponsorship response.");
    }

    return { data: JSON.parse(content) as SponsorshipOutput, source: "openai" };
  } catch (error) {
    return {
      data: createMockSponsorshipOutput(goal, organizerOutput),
      source: "mock",
      error: error instanceof Error ? error.message : "Unknown OpenAI sponsorship error."
    };
  }
}

function createMockSponsorshipOutput(goal: string, organizerOutput: OrganizerOutput): SponsorshipOutput {
  const eventName = organizerOutput.eventConcept.name;

  return {
    sponsorshipPackages: [
      {
        name: "Community Partner",
        price: 2500,
        benefits: ["Logo on website", "Mention in launch post", "Access to post-event recap"],
        idealSponsorProfile: "Local startup ecosystem partners and developer communities"
      },
      {
        name: "Track Sponsor",
        price: 7500,
        benefits: ["Named track", "Judge seat", "Mentor session", "Finalist intro access"],
        idealSponsorProfile: "AI tooling, cloud, data, and developer platform companies"
      },
      {
        name: "Title Sponsor",
        price: 15000,
        benefits: ["Top billing", "Keynote slot", "Premium talent access", "Custom challenge prompt"],
        idealSponsorProfile: "Companies seeking strong brand association with AI builders"
      }
    ],
    sponsorDiscovery: [
      {
        segment: "Developer infrastructure",
        targetCompanies: ["Vercel", "Supabase", "Neon", "Railway"],
        rationale: "The event produces demos that naturally use deployment, database, and developer workflow tools."
      },
      {
        segment: "AI platforms",
        targetCompanies: ["OpenAI", "Anthropic", "Mistral AI", "Cohere"],
        rationale: "The hackathon centers AI-powered workflows and creates direct builder adoption stories."
      },
      {
        segment: "Startup accelerators",
        targetCompanies: ["Entrepreneur First", "Antler", "Techstars"],
        rationale: "Participants may become founder leads, making the event useful for sourcing and community."
      }
    ],
    personalizedOutreach: [
      {
        sponsorName: "Supabase",
        subject: `Sponsor ${eventName}: AI builders shipping operational tools`,
        message:
          `Hi Supabase team, ${eventName} is bringing AI builders together to ship tools for hackathon operations, sponsor intelligence, and builder experience. Supabase would be a natural infrastructure partner because teams need fast auth, database, and realtime primitives to ship in a weekend. Could we explore a Track Sponsor package?`,
        personalizationAngle: "Connects Supabase primitives to fast hackathon product development."
      },
      {
        sponsorName: "Vercel",
        subject: "Help HackOS teams ship polished AI demos",
        message:
          `Hi Vercel team, we are organizing ${eventName}, focused on practical AI products for hackathon organizers. Vercel is a strong fit because demo quality and fast deployment are central to the event. Would you be open to discussing a sponsor role that gives builders credits, visibility, and final-demo presence?`,
        personalizationAngle: "Positions Vercel as the path from prototype to public demo."
      },
      {
        sponsorName: "OpenAI",
        subject: "Partner on a hackathon for practical AI operations",
        message:
          `Hi OpenAI team, ${eventName} is designed around builders creating practical AI systems for end-to-end event organization. Given the goal, OpenAI sponsorship could support serious applied projects and produce strong examples of AI agents improving real workflows. Could we share the sponsor brief?`,
        personalizationAngle: `Links the sponsor story directly to the user's goal: ${goal}.`
      }
    ],
    pipeline: [
      {
        stage: "Prospect",
        actions: ["Build a 30-company sponsor list", "Tag each company by sponsor segment and likely package"],
        exitCriteria: "Company has a named contact and a clear reason to care"
      },
      {
        stage: "Outreach",
        actions: ["Send personalized first email", "Connect on LinkedIn with a short note"],
        exitCriteria: "Contact replies, forwards internally, or books a call"
      },
      {
        stage: "Discovery",
        actions: ["Confirm sponsor goals", "Map goals to package benefits"],
        exitCriteria: "Sponsor agrees the event audience and package are relevant"
      },
      {
        stage: "Proposal",
        actions: ["Send tailored one-page proposal", "Offer two package options"],
        exitCriteria: "Sponsor selects package or asks for procurement steps"
      },
      {
        stage: "Closed Won",
        actions: ["Collect logo and assets", "Confirm payment schedule", "Add sponsor to run-of-show"],
        exitCriteria: "Agreement and invoice are complete"
      }
    ],
    expectedSponsorshipValues: {
      conservative: 7500,
      expected: 25000,
      stretch: 50000,
      assumptions: [
        "One title sponsor or two track sponsors can anchor the budget",
        "Developer tooling companies have direct audience fit",
        "Package value increases if participant quality and demo distribution are strong"
      ]
    },
    negotiationStrategy: {
      anchors: [
        "Lead with track or title sponsorship before offering community partner",
        "Quantify access to builders, projects, demos, and post-event content",
        "Tie custom challenges to sponsor product adoption"
      ],
      concessions: [
        "Add mentor office hours",
        "Include a post-event insight report",
        "Offer extra social mentions without lowering price first"
      ],
      redLines: [
        "No sponsor control over judging outcomes",
        "No access to participant personal data without consent",
        "No exclusivity unless priced as title-level sponsorship"
      ],
      followUpCadence: ["Day 0: personalized email", "Day 3: short bump with sponsor angle", "Day 7: final value-add note"]
    }
  };
}
