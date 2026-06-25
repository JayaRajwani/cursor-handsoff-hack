import OpenAI from "openai";

export type OrganizerOutput = {
  eventConcept: {
    name: string;
    tagline: string;
    audience: string;
    format: string;
    duration: string;
    differentiator: string;
  };
  themes: string[];
  tracks: Array<{
    name: string;
    description: string;
    exampleProjects: string[];
  }>;
  websiteContent: {
    heroHeadline: string;
    heroSubheadline: string;
    about: string;
    whyAttend: string[];
    scheduleHighlights: string[];
    faq: Array<{
      question: string;
      answer: string;
    }>;
  };
  launchPost: {
    channel: string;
    copy: string;
    hashtags: string[];
  };
  applicationFlow: {
    steps: string[];
    formFields: string[];
    screeningCriteria: string[];
  };
  submissionFlow: {
    steps: string[];
    requiredArtifacts: string[];
    deadlineGuidance: string;
  };
  judgingPreEvaluation: {
    rubric: Array<{
      criterion: string;
      weight: number;
      description: string;
    }>;
    preScreeningChecks: string[];
  };
  organizerChecklist: Array<{
    phase: string;
    tasks: string[];
  }>;
  delegationContext: {
    futureAgents: string[];
    handoffNotes: string[];
    risks: string[];
  };
};

export type AgentRunResult<T> = {
  data: T;
  source: "openai" | "mock";
  error?: string;
};

const organizerSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "eventConcept",
    "themes",
    "tracks",
    "websiteContent",
    "launchPost",
    "applicationFlow",
    "submissionFlow",
    "judgingPreEvaluation",
    "organizerChecklist",
    "delegationContext"
  ],
  properties: {
    eventConcept: {
      type: "object",
      additionalProperties: false,
      required: ["name", "tagline", "audience", "format", "duration", "differentiator"],
      properties: {
        name: { type: "string" },
        tagline: { type: "string" },
        audience: { type: "string" },
        format: { type: "string" },
        duration: { type: "string" },
        differentiator: { type: "string" }
      }
    },
    themes: { type: "array", items: { type: "string" }, minItems: 3 },
    tracks: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "description", "exampleProjects"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          exampleProjects: { type: "array", items: { type: "string" }, minItems: 2 }
        }
      }
    },
    websiteContent: {
      type: "object",
      additionalProperties: false,
      required: ["heroHeadline", "heroSubheadline", "about", "whyAttend", "scheduleHighlights", "faq"],
      properties: {
        heroHeadline: { type: "string" },
        heroSubheadline: { type: "string" },
        about: { type: "string" },
        whyAttend: { type: "array", items: { type: "string" }, minItems: 3 },
        scheduleHighlights: { type: "array", items: { type: "string" }, minItems: 3 },
        faq: {
          type: "array",
          minItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["question", "answer"],
            properties: {
              question: { type: "string" },
              answer: { type: "string" }
            }
          }
        }
      }
    },
    launchPost: {
      type: "object",
      additionalProperties: false,
      required: ["channel", "copy", "hashtags"],
      properties: {
        channel: { type: "string" },
        copy: { type: "string" },
        hashtags: { type: "array", items: { type: "string" }, minItems: 3 }
      }
    },
    applicationFlow: {
      type: "object",
      additionalProperties: false,
      required: ["steps", "formFields", "screeningCriteria"],
      properties: {
        steps: { type: "array", items: { type: "string" }, minItems: 4 },
        formFields: { type: "array", items: { type: "string" }, minItems: 5 },
        screeningCriteria: { type: "array", items: { type: "string" }, minItems: 3 }
      }
    },
    submissionFlow: {
      type: "object",
      additionalProperties: false,
      required: ["steps", "requiredArtifacts", "deadlineGuidance"],
      properties: {
        steps: { type: "array", items: { type: "string" }, minItems: 4 },
        requiredArtifacts: { type: "array", items: { type: "string" }, minItems: 3 },
        deadlineGuidance: { type: "string" }
      }
    },
    judgingPreEvaluation: {
      type: "object",
      additionalProperties: false,
      required: ["rubric", "preScreeningChecks"],
      properties: {
        rubric: {
          type: "array",
          minItems: 4,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["criterion", "weight", "description"],
            properties: {
              criterion: { type: "string" },
              weight: { type: "number" },
              description: { type: "string" }
            }
          }
        },
        preScreeningChecks: { type: "array", items: { type: "string" }, minItems: 3 }
      }
    },
    organizerChecklist: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["phase", "tasks"],
        properties: {
          phase: { type: "string" },
          tasks: { type: "array", items: { type: "string" }, minItems: 3 }
        }
      }
    },
    delegationContext: {
      type: "object",
      additionalProperties: false,
      required: ["futureAgents", "handoffNotes", "risks"],
      properties: {
        futureAgents: { type: "array", items: { type: "string" }, minItems: 3 },
        handoffNotes: { type: "array", items: { type: "string" }, minItems: 3 },
        risks: { type: "array", items: { type: "string" }, minItems: 3 }
      }
    }
  }
} as const;

export async function runOrganizerAgent(goal: string): Promise<AgentRunResult<OrganizerOutput>> {
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
            "You are the Main Organizer Agent for HackOS. Return only valid JSON matching the provided schema. Be concrete, operational, and useful to a hackathon frontend."
        },
        {
          role: "user",
          content: `Create the full organizer plan for this hackathon goal: ${goal}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "organizer_output",
          strict: true,
          schema: organizerSchema
        }
      }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned an empty organizer response.");
    }

    return { data: JSON.parse(content) as OrganizerOutput, source: "openai" };
  } catch (error) {
    return {
      data: createMockOrganizerOutput(goal),
      source: "mock",
      error: error instanceof Error ? error.message : "Unknown OpenAI organizer error."
    };
  }
}

function createMockOrganizerOutput(goal: string): OrganizerOutput {
  return {
    eventConcept: {
      name: "HackOS Launch Sprint",
      tagline: "Build the operating system for ambitious hackathons.",
      audience: "AI builders, product-minded engineers, student founders, and organizer teams",
      format: "Hybrid weekend hackathon with async prep and live demo day",
      duration: "10-day application window, 48-hour build sprint, 1 live final showcase",
      differentiator: `Focused around: ${goal}`
    },
    themes: ["AI for operations", "Community tooling", "Future of work", "Responsible automation"],
    tracks: [
      {
        name: "Organizer Automation",
        description: "Tools that reduce manual coordination work before, during, and after the event.",
        exampleProjects: ["AI volunteer scheduler", "Participant support copilot"]
      },
      {
        name: "Sponsor Intelligence",
        description: "Systems that help teams match hackathon outcomes with sponsor objectives.",
        exampleProjects: ["Sponsor-fit scoring engine", "Personalized outreach writer"]
      },
      {
        name: "Builder Experience",
        description: "Products that make team formation, submissions, and judging easier for participants.",
        exampleProjects: ["Team matching board", "Submission quality checker"]
      }
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
        "Get clear judging criteria and sponsor-facing feedback"
      ],
      scheduleHighlights: [
        "Applications and team formation open two weeks before kickoff",
        "Live kickoff introduces tracks, mentors, and judging rubric",
        "Final showcase includes demos, sponsor feedback, and winner announcements"
      ],
      faq: [
        {
          question: "Who should apply?",
          answer: "Builders, designers, operators, and students who want to ship practical AI tools."
        },
        {
          question: "Do I need a team?",
          answer: "No. Solo builders are welcome, and team formation support is included."
        },
        {
          question: "What should teams submit?",
          answer: "A demo link, short pitch, repo or build notes, and a clear explanation of user value."
        }
      ]
    },
    launchPost: {
      channel: "LinkedIn",
      copy:
        "We are launching HackOS: a focused AI hackathon for builders creating the operating system for better hackathons. Apply to build tools for organizer automation, sponsor intelligence, and the builder experience.",
      hashtags: ["#Hackathon", "#AI", "#Builders", "#Startups"]
    },
    applicationFlow: {
      steps: [
        "Collect applicant profile and building interests",
        "Ask for preferred tracks and availability",
        "Screen for motivation, skill fit, and collaboration style",
        "Confirm acceptance and invite participants to onboarding"
      ],
      formFields: [
        "Name",
        "Email",
        "Location or timezone",
        "Role or skills",
        "Portfolio or GitHub",
        "Preferred track",
        "Team status",
        "Motivation"
      ],
      screeningCriteria: [
        "Can participate during core sprint hours",
        "Has a credible build or collaboration signal",
        "Shows alignment with event themes"
      ]
    },
    submissionFlow: {
      steps: [
        "Open submissions at kickoff",
        "Remind teams 12 hours before deadline",
        "Run pre-evaluation checks after submission",
        "Route qualified projects to judges",
        "Publish finalists for demo day"
      ],
      requiredArtifacts: ["Demo video or live URL", "Project summary", "Repo or technical notes", "Team details"],
      deadlineGuidance: "Close submissions two hours before judging so organizers can review completeness."
    },
    judgingPreEvaluation: {
      rubric: [
        {
          criterion: "Problem clarity",
          weight: 20,
          description: "The project identifies a real hackathon operations problem."
        },
        {
          criterion: "Execution quality",
          weight: 30,
          description: "The demo works and the technical approach is credible."
        },
        {
          criterion: "User value",
          weight: 25,
          description: "The solution would save time, increase quality, or improve participant experience."
        },
        {
          criterion: "Sponsor relevance",
          weight: 15,
          description: "The outcome creates a clear story for sponsor partners."
        },
        {
          criterion: "Responsible design",
          weight: 10,
          description: "The team considered privacy, safety, and operational failure modes."
        }
      ],
      preScreeningChecks: [
        "Submission includes all required artifacts",
        "Demo is accessible to judges",
        "Project is aligned to at least one event track"
      ]
    },
    organizerChecklist: [
      {
        phase: "Planning",
        tasks: ["Lock event positioning", "Confirm judging rubric", "Draft sponsor prospect list"]
      },
      {
        phase: "Launch",
        tasks: ["Publish landing page", "Post announcement", "Open applications"]
      },
      {
        phase: "Sprint",
        tasks: ["Run kickoff", "Monitor participant questions", "Send deadline reminders"]
      },
      {
        phase: "Judging",
        tasks: ["Check submissions", "Assign judges", "Prepare finalist run-of-show"]
      }
    ],
    delegationContext: {
      futureAgents: ["Marketing Agent", "Logistics Agent", "Judging Agent", "Participant Support Agent"],
      handoffNotes: [
        "Marketing should reuse the event concept and launch post",
        "Logistics should turn the checklist into dated milestones",
        "Judging should expand the rubric into scorecards"
      ],
      risks: [
        "Sponsor value proposition may need industry focus",
        "Hybrid format requires timezone planning",
        "Submission quality depends on clear artifact guidance"
      ]
    }
  };
}
