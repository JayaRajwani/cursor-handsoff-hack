export interface EventBrief {
  eventName: string;
  goal: string;
  city: string;
  targetDateRange?: {
    start: string;
    end: string;
  };
  expectedParticipants: number;
  expectedOrganisers?: number;
  expectedJudgesAndMentors?: number;
  duration: string;
  budget: {
    venue: number;
    total: number;
  };
  tracks: string[];
  requiresOvernightAccess: boolean;
  requiresStrongWifi: boolean;
  communityPlatform: string;
  /** Additional community platforms run alongside the primary one, e.g. ["WhatsApp"]. */
  secondaryCommunityPlatforms?: string[];
  /** Whether to provision a WhatsApp community. Defaults to true when WhatsApp is listed. */
  whatsappEnabled?: boolean;
  /** Default dialling region for participant numbers, e.g. "+44". */
  whatsappCountryCode?: string;
  tone: string;
  eventDescription?: string;
  participantTypes?: string[];
  schedule?: Record<string, string>;
  codeOfConductUrl?: string;
  sponsorNames?: string[];
  organiserNames?: string[];
  judgingProcess?: string;
  submissionProcess?: string;
  emergencyContact?: string;
  moderationStrictness?: string;
  beginnerFriendly?: boolean;
  teamFormationTiming?: "before" | "during" | "both";
  requiredRooms?: string[];
  requiredFacilities?: string[];
  transportPreferences?: string[];
  accessibilityRequirements?: string[];
  sponsorBrandRequirements?: string[];
  cateringRequirements?: string[];
  wifiRequirements?: string;
  preferredVibe?: string;
}

export interface OrchestrationResult {
  venue: unknown;
  community: unknown;
  timestamp: string;
}
