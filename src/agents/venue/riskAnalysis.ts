import type { VenueRecord, VenueRisk } from "./types.js";

export function analyzeVenueRisks(venue: VenueRecord): VenueRisk {
  const risks: VenueRisk["risks"] = [];

  if (venue.wifiQuality === "poor" || venue.wifiQuality === "adequate") {
    risks.push({
      category: "weak WiFi",
      severity: venue.wifiQuality === "poor" ? "high" : "medium",
      description: `WiFi rated ${venue.wifiQuality}: ${venue.wifiDetails}`,
      mitigation: "Request dedicated SSID with bandwidth guarantee; deploy backup 5G routers",
    });
  }

  if (
    venue.powerAvailability.toLowerCase().includes("insufficient") ||
    venue.powerAvailability.toLowerCase().includes("280 outlets") ||
    (venue.capacity < 400 && venue.powerAvailability.toLowerCase().includes("350"))
  ) {
    risks.push({
      category: "insufficient power",
      severity: "high",
      description: venue.powerAvailability,
      mitigation: "Hire supplemental power distribution; reduce capacity or use overflow space",
    });
  }

  if (venue.transportLinks.length < 2) {
    risks.push({
      category: "poor transport",
      severity: "medium",
      description: `Only ${venue.transportLinks.length} transport link(s): ${venue.transportLinks.join(", ")}`,
      mitigation: "Arrange shuttle from major station; communicate travel guidance early",
    });
  }

  const overnightPolicy = venue.overnightPolicy.toLowerCase();
  if (
    overnightPolicy.includes("not standard") ||
    overnightPolicy.includes("no overnight") ||
    overnightPolicy.includes("closes at")
  ) {
    risks.push({
      category: "unclear overnight access",
      severity: overnightPolicy.includes("no overnight") ? "high" : "medium",
      description: venue.overnightPolicy,
      mitigation: "Confirm overnight access in writing before deposit; identify 24h backup venue",
    });
  }

  if (venue.estimatedCost > 35000) {
    risks.push({
      category: "too expensive",
      severity: "medium",
      description: `Estimated cost £${venue.estimatedCost.toLocaleString()} may strain budget`,
      mitigation: "Negotiate package rate; seek venue sponsor to offset costs",
    });
  }

  const breakoutRooms = venue.roomBreakdown.filter((r) =>
    r.purpose.toLowerCase().includes("breakout"),
  );
  if (breakoutRooms.length < 2) {
    risks.push({
      category: "not enough breakout rooms",
      severity: "medium",
      description: `Only ${breakoutRooms.length} dedicated breakout space(s) for ${venue.capacity} capacity`,
      mitigation: "Use soft partitioning in main hall; book adjacent overflow rooms",
    });
  }

  if (venue.accessibility.length < 3) {
    risks.push({
      category: "low accessibility",
      severity: "medium",
      description: `Limited accessibility features: ${venue.accessibility.join(", ") || "none listed"}`,
      mitigation: "Conduct accessibility audit; arrange portable equipment (ramps, hearing loops)",
    });
  }

  if (venue.cateringPolicy.toLowerCase().includes("exclusive")) {
    risks.push({
      category: "strict catering restrictions",
      severity: "low",
      description: venue.cateringPolicy,
      mitigation: "Negotiate caterer of choice clause; budget for premium in-house pricing",
    });
  }

  if (!venue.contactPerson) {
    risks.push({
      category: "no clear contact person",
      severity: "medium",
      description: `No named contact; general email ${venue.contactEmail}`,
      mitigation: "Request dedicated event manager assignment in initial outreach",
    });
  }

  if (venue.hiddenCosts?.length) {
    for (const cost of venue.hiddenCosts) {
      risks.push({
        category: "hidden costs",
        severity: "medium",
        description: cost,
        mitigation: "Request itemised quote with all surcharges disclosed upfront",
      });
    }
  }

  if (
    venue.insuranceRequirements.toLowerCase().includes("£10m") ||
    venue.depositRequirement > venue.estimatedCost * 0.4
  ) {
    risks.push({
      category: "contract risk",
      severity: "medium",
      description: `Insurance: ${venue.insuranceRequirements}. Deposit: £${venue.depositRequirement.toLocaleString()}`,
      mitigation: "Review contract with legal; negotiate deposit schedule tied to milestones",
    });
  }

  const highCount = risks.filter((r) => r.severity === "high").length;
  const mediumCount = risks.filter((r) => r.severity === "medium").length;

  let riskLevel: VenueRisk["riskLevel"];
  if (highCount >= 2) riskLevel = "high";
  else if (highCount >= 1 || mediumCount >= 3) riskLevel = "medium";
  else riskLevel = "low";

  return {
    venueId: venue.id,
    venueName: venue.name,
    riskLevel,
    risks,
  };
}

export function analyzeAllVenueRisks(venues: VenueRecord[]): VenueRisk[] {
  return venues.map(analyzeVenueRisks);
}
