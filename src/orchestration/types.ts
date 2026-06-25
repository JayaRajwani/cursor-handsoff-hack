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
