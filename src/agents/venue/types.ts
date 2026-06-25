import type { EventBrief } from "../../orchestration/types.js";

export type AvailabilityStatus = "available" | "limited" | "unavailable" | "unknown";
export type WifiQuality = "excellent" | "good" | "adequate" | "poor" | "unknown";
export type VenueVibe =
  | "university"
  | "warehouse"
  | "startup office"
  | "conference venue"
  | "arts space"
  | "corporate HQ";

export interface RoomBreakdown {
  name: string;
  capacity: number;
  purpose: string;
}

export interface VenueRecord {
  id: string;
  name: string;
  address: string;
  city: string;
  website: string;
  contactEmail: string;
  contactPhone?: string;
  capacity: number;
  roomBreakdown: RoomBreakdown[];
  estimatedCost: number;
  depositRequirement: number;
  availabilityStatus: AvailabilityStatus;
  wifiQuality: WifiQuality;
  wifiDetails: string;
  transportLinks: string[];
  accessibility: string[];
  cateringPolicy: string;
  overnightPolicy: string;
  securityPolicy: string;
  avEquipment: string[];
  powerAvailability: string;
  insuranceRequirements: string;
  sponsorVisibilityOptions: string[];
  photos: string[];
  notes: string;
  vibe: VenueVibe;
  hiddenCosts?: string[];
  contactPerson?: string;
}

export interface ScoreDimension {
  dimension: string;
  score: number;
  maxScore: number;
  reasoning: string;
}

export interface VenueScore {
  venueId: string;
  venueName: string;
  totalScore: number;
  maxTotalScore: number;
  dimensions: ScoreDimension[];
  summary: string;
}

export interface VenueRisk {
  venueId: string;
  venueName: string;
  riskLevel: "low" | "medium" | "high";
  risks: Array<{
    category: string;
    severity: "low" | "medium" | "high";
    description: string;
    mitigation: string;
  }>;
}

export interface TopRecommendation {
  venue: VenueRecord;
  score: VenueScore;
  whyBest: string;
  tradeoffs: string[];
  estimatedTotalCost: number;
  nextAction: string;
  emailDraft: string;
  negotiationAngle: string;
  fallback: {
    venueId: string;
    venueName: string;
    reason: string;
  };
}

export interface OutreachDraft {
  venueId: string;
  venueName: string;
  contactEmail: string;
  subject: string;
  body: string;
  approvalStatus: "pending" | "approved" | "sent";
  reason: string;
  venueSummary: string;
}

export interface VenueAgentInput extends EventBrief {}

export interface VenueAgentOutput {
  agent: "venue-agent";
  status: "completed" | "pending_approval" | "needs_input" | "failed";
  event: VenueAgentInput;
  rankedVenues: Array<{
    rank: number;
    venue: VenueRecord;
    score: VenueScore;
  }>;
  topRecommendation: TopRecommendation | null;
  risks: VenueRisk[];
  outreachDrafts: OutreachDraft[];
  nextActions: string[];
  approvalRequired: boolean;
}

export interface VenueSearchOptions {
  city: string;
  minCapacity: number;
  maxBudget: number;
  mockMode: boolean;
}
