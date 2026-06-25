#!/usr/bin/env tsx
/**
 * Send one real WhatsApp message through Wassist into an active conversation.
 *
 * SAFE BY DEFAULT: with no flag this is a DRY RUN — it lists conversations and
 * shows exactly what it would send, but transmits nothing. Pass --send to
 * actually deliver the message to a real phone.
 *
 *   npm run wassist:send-test                 # dry run
 *   npm run wassist:send-test -- --send       # really send
 *   WASSIST_CONVERSATION_ID=<uuid> WASSIST_TEST_MESSAGE="hi" npm run wassist:send-test -- --send
 *
 * Reads WASSIST_* from .env.local if present.
 */
import { readFileSync } from "node:fs";
import { loadWassistConfig, WassistClient } from "../src/agents/community/wassistClient.js";

function loadDotEnvLocal(): void {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  } catch {
    /* rely on the real environment */
  }
}

interface Conversation {
  id: string;
  active?: boolean;
  contact?: { phoneNumber?: string; name?: string | null };
  whatsappNumber?: { number?: string };
  chatWindowRemainingTime?: number;
}

function fmtWindow(seconds?: number): string {
  if (!seconds || seconds <= 0) return "closed";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m left`;
}

async function main(): Promise<void> {
  loadDotEnvLocal();
  const willSend = process.argv.includes("--send");
  const config = loadWassistConfig(process.env);
  if (!config.hasKey) {
    console.log("\n⚠️  No WASSIST_API_KEY set in .env.local. Aborting.\n");
    process.exitCode = 1;
    return;
  }

  const client = new WassistClient(config);
  const conversations = (await client.listConversations()) as Conversation[];

  console.log("\n💬 Wassist conversations\n");
  if (conversations.length === 0) {
    console.log("  None yet. Have someone message your Wassist number, then re-run.\n");
    return;
  }
  for (const c of conversations) {
    const tag = c.active ? "active" : "inactive";
    console.log(
      `  ${c.id}\n    to ${c.contact?.phoneNumber ?? "?"} via ${c.whatsappNumber?.number ?? "?"} · ${tag} · window ${fmtWindow(c.chatWindowRemainingTime)}`,
    );
  }

  const target =
    (process.env.WASSIST_CONVERSATION_ID &&
      conversations.find((c) => c.id === process.env.WASSIST_CONVERSATION_ID)) ||
    conversations.find((c) => c.active && (c.chatWindowRemainingTime ?? 0) > 0) ||
    conversations[0];

  if (!target) {
    console.log("\n  No suitable conversation found.\n");
    return;
  }

  const body =
    process.env.WASSIST_TEST_MESSAGE ??
    "👋 Test from HackOS — the WhatsApp pipeline is wired up. (You can ignore this.)";

  console.log(`\n→ Target conversation: ${target.id}`);
  console.log(`  Recipient: ${target.contact?.phoneNumber ?? "?"}`);
  console.log(`  Message:   ${body}`);

  if (!willSend) {
    console.log("\n🟡 DRY RUN — nothing sent. Re-run with --send to deliver for real:");
    console.log("     npm run wassist:send-test -- --send\n");
    return;
  }

  if ((target.chatWindowRemainingTime ?? 0) <= 0) {
    console.log(
      "\n❌ The 24h customer-service window is closed for this conversation. A free-text message will be rejected; use an approved template instead.\n",
    );
    process.exitCode = 1;
    return;
  }

  console.log("\n🚀 Sending for real…");
  const result = await client.sendText(target.id, body);
  console.log(`✅ Sent. messageId: ${result.messageId || "(none returned)"}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
