import type { VenueAgentInput, VenueRecord, VenueScore, ScoreDimension } from "./types.js";

const DIMENSION_WEIGHTS: Record<string, number> = {
  capacityFit: 12,
  totalCost: 12,
  transportAccess: 8,
  wifiReliability: 12,
  accessibility: 8,
  roomSuitability: 10,
  hackathonPracticality: 10,
  sponsorValue: 8,
  overnightFeasibility: 10,
  cateringFeasibility: 5,
  riskLevel: 5,
};

function scoreCapacityFit(venue: VenueRecord, input: VenueAgentInput): ScoreDimension {
  const totalAttendees =
    input.expectedParticipants +
    (input.expectedOrganisers ?? 10) +
    (input.expectedJudgesAndMentors ?? 20);
  const ratio = venue.capacity / totalAttendees;

  let score: number;
  let reasoning: string;

  if (ratio >= 1.0 && ratio <= 1.2) {
    score = 100;
    reasoning = `Capacity ${venue.capacity} is ideal for ${totalAttendees} attendees (${Math.round(ratio * 100)}% utilisation).`;
  } else if (ratio >= 0.85) {
    score = 75;
    reasoning = `Capacity ${venue.capacity} is slightly tight for ${totalAttendees} attendees but workable with overflow planning.`;
  } else if (ratio >= 0.7) {
    score = 50;
    reasoning = `Capacity ${venue.capacity} is below target for ${totalAttendees} attendees — significant overflow risk.`;
  } else {
    score = 20;
    reasoning = `Capacity ${venue.capacity} is insufficient for ${totalAttendees} expected attendees.`;
  }

  return { dimension: "capacityFit", score, maxScore: 100, reasoning };
}

function scoreTotalCost(venue: VenueRecord, input: VenueAgentInput): ScoreDimension {
  const budget = input.budget.venue;
  const cost = venue.estimatedCost + (venue.hiddenCosts?.length ? 2000 : 0);
  const ratio = cost / budget;

  let score: number;
  let reasoning: string;

  if (ratio <= 0.85) {
    score = 100;
    reasoning = `Estimated cost £${venue.estimatedCost.toLocaleString()} is well within the £${budget.toLocaleString()} venue budget.`;
  } else if (ratio <= 1.0) {
    score = 85;
    reasoning = `Estimated cost £${venue.estimatedCost.toLocaleString()} fits within the £${budget.toLocaleString()} budget with minimal headroom.`;
  } else if (ratio <= 1.2) {
    score = 55;
    reasoning = `Estimated cost £${venue.estimatedCost.toLocaleString()} exceeds budget by ${Math.round((ratio - 1) * 100)}% — negotiation or sponsor offset needed.`;
  } else {
    score = 20;
    reasoning = `Estimated cost £${venue.estimatedCost.toLocaleString()} is significantly over the £${budget.toLocaleString()} budget.`;
  }

  if (venue.hiddenCosts?.length) {
    reasoning += ` Hidden costs identified: ${venue.hiddenCosts.join(", ")}.`;
  }

  return { dimension: "totalCost", score, maxScore: 100, reasoning };
}

function scoreTransportAccess(venue: VenueRecord, input: VenueAgentInput): ScoreDimension {
  const links = venue.transportLinks;
  const hasTube = links.some((l) => l.toLowerCase().includes("tube") && /\d+\s*min/.test(l));
  const tubeWalkMatch = links.find((l) => /(\d+)\s*min walk/.test(l.toLowerCase()));
  const walkMinutes = tubeWalkMatch
    ? parseInt(tubeWalkMatch.match(/(\d+)\s*min/)?.[1] ?? "15", 10)
    : 15;

  let score: number;
  let reasoning: string;

  if (hasTube && walkMinutes <= 5) {
    score = 100;
    reasoning = `Excellent transport: ${links.join("; ")}. Meets preference for Tube within 10 min walk.`;
  } else if (hasTube && walkMinutes <= 10) {
    score = 85;
    reasoning = `Good transport access: ${links.join("; ")}.`;
  } else if (links.length >= 2) {
    score = 65;
    reasoning = `Adequate transport options: ${links.join("; ")}.`;
  } else {
    score = 40;
    reasoning = `Limited transport links: ${links.join("; ")}. May impact attendance.`;
  }

  void input.transportPreferences;
  return { dimension: "transportAccess", score, maxScore: 100, reasoning };
}

function scoreWifiReliability(venue: VenueRecord, input: VenueAgentInput): ScoreDimension {
  const qualityMap: Record<string, number> = {
    excellent: 100,
    good: 80,
    adequate: 55,
    poor: 25,
    unknown: 40,
  };

  let score = qualityMap[venue.wifiQuality] ?? 40;
  let reasoning = `${venue.wifiQuality} WiFi: ${venue.wifiDetails}.`;

  if (input.requiresStrongWifi && venue.wifiQuality === "poor") {
    score = Math.min(score, 20);
    reasoning += " Does not meet strong WiFi requirement.";
  } else if (input.requiresStrongWifi && venue.wifiQuality === "excellent") {
    reasoning += " Exceeds strong WiFi requirement for 500+ devices.";
  }

  return { dimension: "wifiReliability", score, maxScore: 100, reasoning };
}

function scoreAccessibility(venue: VenueRecord, input: VenueAgentInput): ScoreDimension {
  const features = venue.accessibility;
  const required = input.accessibilityRequirements ?? [];
  const matched = required.filter((req) =>
    features.some((f) => f.toLowerCase().includes(req.toLowerCase().split(" ")[0])),
  );

  const coverage = required.length > 0 ? matched.length / required.length : 1;
  const score = Math.round(60 + coverage * 40);
  const reasoning =
    required.length > 0
      ? `Covers ${matched.length}/${required.length} accessibility requirements: ${features.join(", ")}.`
      : `Accessibility features: ${features.join(", ")}.`;

  return { dimension: "accessibility", score, maxScore: 100, reasoning };
}

function scoreRoomSuitability(venue: VenueRecord, input: VenueAgentInput): ScoreDimension {
  const required = input.requiredRooms ?? [];
  const rooms = venue.roomBreakdown.map((r) => r.purpose.toLowerCase());
  const breakoutCount = venue.roomBreakdown.filter((r) =>
    r.purpose.toLowerCase().includes("breakout"),
  ).length;

  let matches = 0;
  for (const req of required) {
    if (rooms.some((r) => r.includes(req.toLowerCase().split(" ")[0]))) {
      matches++;
    }
  }

  const coverage = required.length > 0 ? matches / required.length : 0.8;
  let score = Math.round(coverage * 80);

  if (breakoutCount >= 3) score += 15;
  else if (breakoutCount >= 1) score += 5;

  score = Math.min(100, score);

  const reasoning = `${venue.roomBreakdown.length} rooms including ${breakoutCount} breakout spaces. Matches ${matches}/${required.length} required room types.`;

  return { dimension: "roomSuitability", score, maxScore: 100, reasoning };
}

function scoreHackathonPracticality(venue: VenueRecord): ScoreDimension {
  let score = 50;
  const reasons: string[] = [];

  if (venue.powerAvailability.toLowerCase().includes("500") || venue.powerAvailability.toLowerCase().includes("developer")) {
    score += 20;
    reasons.push("developer-grade power infrastructure");
  } else if (venue.powerAvailability.toLowerCase().includes("350")) {
    score += 5;
    reasons.push("adequate but not ideal power");
  } else {
    reasons.push("power may be limiting");
  }

  if (venue.avEquipment.length >= 4) {
    score += 15;
    reasons.push("comprehensive AV setup");
  }

  if (venue.vibe === "startup office" || venue.vibe === "university") {
    score += 10;
    reasons.push("hackathon-friendly venue type");
  }

  if (venue.notes.toLowerCase().includes("hackathon") || venue.notes.toLowerCase().includes("developer")) {
    score += 5;
    reasons.push("proven hackathon track record");
  }

  score = Math.min(100, score);

  return {
    dimension: "hackathonPracticality",
    score,
    maxScore: 100,
    reasoning: `Hackathon practicality: ${reasons.join(", ")}.`,
  };
}

function scoreSponsorValue(venue: VenueRecord, input: VenueAgentInput): ScoreDimension {
  const options = venue.sponsorVisibilityOptions;
  const required = input.sponsorBrandRequirements ?? [];
  let score = 40 + Math.min(40, options.length * 12);

  if (options.some((o) => o.toLowerCase().includes("stage") || o.toLowerCase().includes("showcase"))) {
    score += 15;
  }

  score = Math.min(100, score);
  const reasoning = `${options.length} sponsor visibility options available${required.length ? `; assessed against ${required.length} brand requirements` : ""}: ${options.join(", ")}.`;

  return { dimension: "sponsorValue", score, maxScore: 100, reasoning };
}

function scoreOvernightFeasibility(venue: VenueRecord, input: VenueAgentInput): ScoreDimension {
  const policy = venue.overnightPolicy.toLowerCase();
  let score: number;
  let reasoning: string;

  if (policy.includes("24-hour") || policy.includes("24 hour")) {
    score = 100;
    reasoning = `Overnight access confirmed: ${venue.overnightPolicy}`;
  } else if (policy.includes("possible") || policy.includes("approved") || policy.includes("licence")) {
    score = 60;
    reasoning = `Overnight access possible but requires arrangement: ${venue.overnightPolicy}`;
  } else if (policy.includes("not") || policy.includes("closes") || policy.includes("no overnight")) {
    score = 10;
    reasoning = `Overnight access not available: ${venue.overnightPolicy}`;
  } else {
    score = 40;
    reasoning = `Overnight policy unclear: ${venue.overnightPolicy}`;
  }

  if (input.requiresOvernightAccess && score < 50) {
    score = Math.min(score, 20);
    reasoning += " FAILS overnight access requirement.";
  }

  return { dimension: "overnightFeasibility", score, maxScore: 100, reasoning };
}

function scoreCateringFeasibility(venue: VenueRecord, input: VenueAgentInput): ScoreDimension {
  const policy = venue.cateringPolicy.toLowerCase();
  let score: number;
  let reasoning: string;

  if (policy.includes("external caterers welcome") || policy.includes("external caterers allowed")) {
    score = 90;
    reasoning = `Flexible catering: ${venue.cateringPolicy}`;
  } else if (policy.includes("in-house") && policy.includes("partner")) {
    score = 70;
    reasoning = `In-house partner available with some flexibility: ${venue.cateringPolicy}`;
  } else if (policy.includes("exclusive")) {
    score = 45;
    reasoning = `Restrictive catering policy may increase costs: ${venue.cateringPolicy}`;
  } else {
    score = 60;
    reasoning = `Catering policy: ${venue.cateringPolicy}`;
  }

  void input.cateringRequirements;
  return { dimension: "cateringFeasibility", score, maxScore: 100, reasoning };
}

function scoreRiskLevel(venue: VenueRecord): ScoreDimension {
  let penalty = 0;
  const risks: string[] = [];

  if (venue.hiddenCosts?.length) {
    penalty += 20;
    risks.push("hidden costs");
  }
  if (!venue.contactPerson) {
    penalty += 15;
    risks.push("no clear contact person");
  }
  if (venue.availabilityStatus === "limited") {
    penalty += 10;
    risks.push("limited availability");
  }
  if (venue.availabilityStatus === "unavailable") {
    penalty += 40;
    risks.push("unavailable");
  }
  if (venue.wifiQuality === "poor" || venue.wifiQuality === "adequate") {
    penalty += 10;
    risks.push("WiFi concerns");
  }

  const score = Math.max(0, 100 - penalty);
  const reasoning =
    risks.length > 0
      ? `Risk factors: ${risks.join(", ")}. Risk-adjusted score: ${score}/100.`
      : "No significant risk flags identified.";

  return { dimension: "riskLevel", score, maxScore: 100, reasoning };
}

export function scoreVenue(venue: VenueRecord, input: VenueAgentInput): VenueScore {
  const dimensions: ScoreDimension[] = [
    scoreCapacityFit(venue, input),
    scoreTotalCost(venue, input),
    scoreTransportAccess(venue, input),
    scoreWifiReliability(venue, input),
    scoreAccessibility(venue, input),
    scoreRoomSuitability(venue, input),
    scoreHackathonPracticality(venue),
    scoreSponsorValue(venue, input),
    scoreOvernightFeasibility(venue, input),
    scoreCateringFeasibility(venue, input),
    scoreRiskLevel(venue),
  ];

  let weightedTotal = 0;
  let maxWeighted = 0;

  for (const dim of dimensions) {
    const weight = DIMENSION_WEIGHTS[dim.dimension] ?? 5;
    weightedTotal += (dim.score / dim.maxScore) * weight;
    maxWeighted += weight;
  }

  const totalScore = Math.round((weightedTotal / maxWeighted) * 100);

  const topDims = [...dimensions]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((d) => d.dimension);

  return {
    venueId: venue.id,
    venueName: venue.name,
    totalScore,
    maxTotalScore: 100,
    dimensions,
    summary: `Overall score ${totalScore}/100. Strongest in ${topDims.join(", ")}.`,
  };
}

export function rankVenues(
  venues: VenueRecord[],
  input: VenueAgentInput,
): Array<{ venue: VenueRecord; score: VenueScore }> {
  return venues
    .map((venue) => ({ venue, score: scoreVenue(venue, input) }))
    .sort((a, b) => b.score.totalScore - a.score.totalScore);
}
