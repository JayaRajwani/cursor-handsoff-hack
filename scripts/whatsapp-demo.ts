#!/usr/bin/env tsx
/**
 * WhatsApp end-to-end mock walkthrough.
 *
 * Exercises the real MockWhatsAppClient and the WhatsApp plan generators the
 * Community Agent uses: provision the community, create every group, register
 * broadcast templates, capture a participant opt-in, and send one UTILITY and
 * one MARKETING broadcast — demonstrating the opt-in gate.
 *
 * Run: npm run whatsapp:demo
 */
import { mockEventBrief } from "../src/data/mockEventBrief.js";
import { generateAnnouncementTemplates } from "../src/agents/community/announcements.js";
import {
  generateWhatsAppPlan,
  generateWhatsAppAutomations,
  MockWhatsAppClient,
} from "../src/agents/community/whatsapp.js";
import { CommunityAgent } from "../src/agents/community/CommunityAgent.js";

function divider(title: string): void {
  console.log("\n" + "=".repeat(70));
  console.log(`  ${title}`);
  console.log("=".repeat(70));
}

async function main(): Promise<void> {
  console.log("\n📱 HackOS — WhatsApp Community Walkthrough (mock mode)\n");
  console.log(`Event: ${mockEventBrief.eventName}`);
  console.log(`Participants: ${mockEventBrief.expectedParticipants} | Country code: ${mockEventBrief.whatsappCountryCode}`);

  // 1. Build the plan exactly as the Community Agent does.
  const announcements = generateAnnouncementTemplates(mockEventBrief);
  const plan = generateWhatsAppPlan(mockEventBrief, announcements);

  divider("1. WHATSAPP PLAN");
  console.log(`Community: ${plan.communityName}`);
  console.log(`Enabled: ${plan.enabled} | Groups: ${plan.totalGroups} | Templates: ${plan.broadcastTemplates.length}`);

  // 2. Provision against the mock client (stands in for the Cloud API).
  const wa = new MockWhatsAppClient();

  divider("2. PROVISION COMMUNITY + GROUPS");
  const { communityId } = await wa.createCommunity(plan.communityName, plan.description);
  const groupIds = new Map<string, string>();
  for (const group of plan.groups) {
    const { groupId, inviteLink } = await wa.createGroup(communityId, {
      name: group.name,
      adminOnly: group.adminOnly,
    });
    groupIds.set(group.id, groupId);
    if (group.inviteVisibility === "public") {
      console.log(`      ↳ public invite link: ${inviteLink}`);
    }
  }

  divider("3. REGISTER BROADCAST TEMPLATES WITH META");
  for (const t of plan.broadcastTemplates) {
    const { status } = await wa.registerTemplate({
      name: t.name,
      category: t.category,
      language: t.language,
      body: t.body,
    });
    console.log(`      ↳ ${t.name} [${t.category}] → ${status}`);
  }

  divider("4. PARTICIPANT OPT-IN");
  const participant = `${plan.defaultCountryCode}7700900404`;
  await wa.recordOptIn(participant, true);
  const declined = `${plan.defaultCountryCode}7700900911`;
  await wa.recordOptIn(declined, false);

  divider("5. SEND BROADCASTS (opt-in gate enforced)");
  // Pick one UTILITY (transactional) and one MARKETING (opt-in required) template.
  const utility = plan.broadcastTemplates.find((t) => t.category === "UTILITY")!;
  const marketing = plan.broadcastTemplates.find((t) => t.category === "MARKETING")!;

  const optedIn = new Map<string, boolean>([
    [participant, true],
    [declined, false],
  ]);

  for (const t of [utility, marketing]) {
    console.log(`\n→ ${t.name} (${t.category}, opt-in ${t.requiresOptIn ? "required" : "not required"})`);
    console.log(`  body: ${t.body}`);
    for (const groupId of t.targetGroups) {
      const realGroupId = groupIds.get(groupId) ?? groupId;
      // MARKETING templates may only reach opted-in recipients.
      const audience = t.requiresOptIn
        ? [...optedIn.entries()].filter(([, consent]) => consent).map(([phone]) => phone)
        : [...optedIn.keys()];
      if (t.requiresOptIn && audience.length === 0) {
        console.log(`  ⛔ ${groupId}: skipped — no opted-in recipients`);
        continue;
      }
      await wa.sendTemplate(realGroupId, t.name, t.variables.map((v) => `<${v}>`));
      console.log(`  ✅ ${groupId}: delivered to ${audience.length} recipient(s)`);
    }
  }

  divider("6. WHATSAPP AUTOMATIONS");
  for (const a of generateWhatsAppAutomations()) {
    console.log(`  • ${a.name} — ${a.trigger}`);
    console.log(`      future: ${a.futureIntegration}`);
  }

  // 7. Confirm the agent raises the high-risk approval before any of this is real.
  divider("7. APPROVAL CHECKPOINT (agent-level)");
  const agent = new CommunityAgent({ mockMode: false });
  await agent.plan(mockEventBrief);
  await agent.execute();
  const waApproval = agent.requestApproval().find((a) => a.type === "create_whatsapp_broadcast");
  if (waApproval) {
    console.log(`  [${waApproval.status}] ${waApproval.summary}`);
    console.log(`  risk: ${waApproval.riskLevel}`);
    console.log(`  reason: ${waApproval.reason}`);
    console.log("\n  → In production nothing above is sent until this is approved.");
  }

  console.log("\n✅ WhatsApp walkthrough complete (no network calls — mock mode).\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
