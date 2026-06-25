#!/usr/bin/env tsx
import { createOrchestrator } from "../src/orchestration/MainAgentOrchestrator.js";
import { mockEventBrief } from "../src/data/mockEventBrief.js";

function divider(title: string): void {
  console.log("\n" + "=".repeat(70));
  console.log(`  ${title}`);
  console.log("=".repeat(70));
}

function table(headers: string[], rows: string[][]): void {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)),
  );
  const line = colWidths.map((w) => "-".repeat(w)).join("-+-");
  console.log(colWidths.map((w, i) => headers[i]!.padEnd(w)).join(" | "));
  console.log(line);
  for (const row of rows) {
    console.log(colWidths.map((w, i) => (row[i] ?? "").padEnd(w)).join(" | "));
  }
}

async function main(): Promise<void> {
  console.log("\n🚀 HackOS Demo — London AI Builders Hackathon\n");
  console.log(`Goal: ${mockEventBrief.goal}`);
  console.log(`City: ${mockEventBrief.city} | Participants: ${mockEventBrief.expectedParticipants}`);
  console.log(`Budget: £${mockEventBrief.budget.venue.toLocaleString()} venue / £${mockEventBrief.budget.total.toLocaleString()} total`);

  const orchestrator = createOrchestrator({ mockMode: true });

  divider("VENUE AGENT");
  const venueResult = await orchestrator.runVenueAgent(mockEventBrief);

  if (venueResult.topRecommendation) {
    const top = venueResult.topRecommendation;
    console.log(`\n🏆 TOP RECOMMENDATION: ${top.venue.name}`);
    console.log(`   Score: ${top.score.totalScore}/100`);
    console.log(`   Address: ${top.venue.address}`);
    console.log(`   Est. Total Cost: £${top.estimatedTotalCost.toLocaleString()}`);
    console.log(`\n   Why: ${top.whyBest}`);
    console.log(`\n   Tradeoffs:`);
    for (const t of top.tradeoffs) console.log(`   • ${t}`);
    console.log(`\n   Negotiation: ${top.negotiationAngle}`);
    console.log(`\n   Fallback: ${top.fallback.venueName} — ${top.fallback.reason}`);
  }

  divider("RANKED VENUE TABLE");
  table(
    ["Rank", "Venue", "Score", "Capacity", "Cost", "WiFi", "Overnight"],
    venueResult.rankedVenues.map((r) => [
      String(r.rank),
      r.venue.name,
      `${r.score.totalScore}/100`,
      String(r.venue.capacity),
      `£${r.venue.estimatedCost.toLocaleString()}`,
      r.venue.wifiQuality,
      r.venue.overnightPolicy.includes("24") ? "Yes" : "Check",
    ]),
  );

  divider("VENUE OUTREACH DRAFT");
  for (const draft of venueResult.outreachDrafts) {
    console.log(`\nTo: ${draft.contactEmail}`);
    console.log(`Subject: ${draft.subject}`);
    console.log(`Status: ${draft.approvalStatus}`);
    console.log(`Reason: ${draft.reason}`);
    console.log(`\n${draft.body.slice(0, 600)}...\n[truncated for demo — full draft in output]`);
  }

  divider("COMMUNITY AGENT");
  const communityResult = await orchestrator.runCommunityAgent(mockEventBrief);

  divider("DISCORD SERVER PLAN");
  console.log(`\nServer: ${communityResult.serverPlan.name}`);
  console.log(`Platform: ${communityResult.serverPlan.platform}`);
  console.log(`Categories: ${communityResult.serverPlan.categories.length}`);
  console.log(`Total Channels: ${communityResult.serverPlan.totalChannels}`);
  console.log(`Total Roles: ${communityResult.serverPlan.totalRoles}`);

  console.log("\nChannel Structure:");
  for (const cat of communityResult.serverPlan.categories) {
    const catChannels = communityResult.channels.filter((c) => c.category === cat.name);
    console.log(`\n  📁 ${cat.name}`);
    for (const ch of catChannels) {
      const lock = ch.private ? " 🔒" : "";
      console.log(`     #${ch.name}${lock} (${ch.type})`);
    }
  }

  divider("WHATSAPP COMMUNITY PLAN");
  const wa = communityResult.whatsappPlan;
  console.log(`\nCommunity: ${wa.communityName}`);
  console.log(`Platform: ${wa.platform} (enabled: ${wa.enabled})`);
  console.log(`Default country code: ${wa.defaultCountryCode}`);
  console.log(`Groups: ${wa.totalGroups} | Broadcast templates: ${wa.broadcastTemplates.length}`);
  console.log(`Opt-in policy: ${wa.optInPolicy}`);

  console.log("\nGroups:");
  for (const g of wa.groups) {
    const lock = g.inviteVisibility === "private" ? " 🔒" : g.adminOnly ? " 📣" : "";
    const mirror = g.linkedDiscordChannel ? ` ↔ #${g.linkedDiscordChannel}` : "";
    console.log(`  • ${g.name}${lock} (${g.type})${mirror}`);
  }

  console.log("\nBroadcast templates (require Meta approval before sending):");
  table(
    ["Template", "Category", "Opt-in", "Target Groups"],
    wa.broadcastTemplates.map((t) => [
      t.name,
      t.category,
      t.requiresOptIn ? "required" : "transactional",
      t.targetGroups.join(", "),
    ]),
  );

  divider("ROLE PLAN");
  table(
    ["Role", "Color", "Key Permissions"],
    communityResult.roles.map((r) => [
      r.name,
      r.color,
      r.permissions.slice(0, 3).join(", ") + (r.permissions.length > 3 ? "..." : ""),
    ]),
  );

  divider("WELCOME MESSAGE (first message)");
  const firstWelcome = communityResult.welcomeMessages[0];
  if (firstWelcome) {
    console.log(`\nChannel: #${firstWelcome.channel}`);
    console.log(`\n${firstWelcome.content}`);
  }

  divider("ANNOUNCEMENT QUEUE");
  table(
    ["Type", "Title", "Channels", "Schedule"],
    communityResult.announcementTemplates.map((a) => [
      a.type,
      a.title,
      a.channels.map((c) => `#${c}`).join(", "),
      a.schedule ?? "manual",
    ]),
  );

  divider("MODERATION WORKFLOW");
  console.log(`Escalation path: ${communityResult.moderationWorkflow.escalationPath.join(" → ")}`);
  console.log(`Steps: ${communityResult.moderationWorkflow.steps.length}`);

  divider("COMMUNITY HEALTH (initial state)");
  const health = communityResult.communityHealth;
  console.log(`  Members: ${health.memberCount}`);
  console.log(`  Unassigned participants: ${health.unassignedParticipants}`);
  console.log(`  Announcement queue: ${health.announcementQueue}`);
  console.log(`  Community risk: ${health.communityRiskLevel}`);

  divider("NEXT ACTIONS REQUIRING APPROVAL");
  const venueApprovals = orchestrator.venueAgent.requestApproval();
  const communityApprovals = orchestrator.communityAgent.requestApproval();

  console.log("\n📋 Venue Agent approvals:");
  for (const a of venueApprovals) {
    console.log(`  [${a.status}] ${a.summary}`);
    console.log(`    Action: ${a.proposedAction}`);
    console.log(`    Risk: ${a.riskLevel}`);
  }

  console.log("\n📋 Community Agent approvals:");
  for (const a of communityApprovals) {
    console.log(`  [${a.status}] ${a.summary}`);
    console.log(`    Action: ${a.proposedAction}`);
    console.log(`    Affected: ${a.affectedResources.slice(0, 5).join(", ")}${a.affectedResources.length > 5 ? "..." : ""}`);
    console.log(`    Risk: ${a.riskLevel}`);
  }

  divider("NEXT ACTIONS");
  console.log("\nVenue Agent:");
  for (const action of venueResult.nextActions) console.log(`  • ${action}`);
  console.log("\nCommunity Agent:");
  for (const action of communityResult.nextActions) console.log(`  • ${action}`);

  console.log("\n✅ Demo complete. Run `npm test` for test suite.\n");
}

main().catch(console.error);
