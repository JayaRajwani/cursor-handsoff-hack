#!/usr/bin/env tsx
/**
 * Verify WhatsApp credentials.
 *
 * - Mock mode: reports that no real keys are set and what to do.
 * - Live mode: calls the Graph API to confirm the token + phone number id work,
 *   without sending any message.
 *
 * Run: npm run whatsapp:check
 * Reads WHATSAPP_* from the environment (.env.local is loaded if present).
 */
import { readFileSync } from "node:fs";
import {
  loadWhatsAppConfig,
  LiveWhatsAppClient,
} from "../src/agents/community/whatsappClient.js";

// Minimal .env.local loader (no dependency): only fills vars not already set.
function loadDotEnvLocal(): void {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  } catch {
    /* no .env.local — rely on the real environment */
  }
}

function mask(value: string): string {
  if (!value) return "(empty)";
  if (value.startsWith("placeholder_") || value.startsWith("your_")) return `${value} ⟵ placeholder`;
  if (value.length <= 8) return "•".repeat(value.length);
  return `${value.slice(0, 4)}…${value.slice(-4)} (${value.length} chars)`;
}

async function main(): Promise<void> {
  loadDotEnvLocal();
  const config = loadWhatsAppConfig(process.env, { warn: false });

  console.log("\n📋 WhatsApp credential check\n");
  console.log(`  Mode resolved:        ${config.mode}`);
  console.log(`  Phone number id:      ${mask(config.phoneNumberId)}`);
  console.log(`  Business account id:  ${mask(config.businessAccountId)}`);
  console.log(`  Access token:         ${mask(config.accessToken)}`);
  console.log(`  App secret:           ${mask(config.appSecret)}`);
  console.log(`  Default region:       ${config.defaultCountryCode}`);
  console.log(`  Graph API:            ${config.apiBase || "(mock — no network)"}`);

  if (config.mode === "mock") {
    console.log("\n⚠️  No real credentials detected — running in MOCK mode.");
    console.log("    To go live:");
    console.log("      1. Create a Meta app + add the WhatsApp product (developers.facebook.com)");
    console.log("      2. Put real values in .env.local:");
    console.log("         WHATSAPP_MODE=live");
    console.log("         WHATSAPP_PHONE_NUMBER_ID=...");
    console.log("         WHATSAPP_BUSINESS_ACCOUNT_ID=...");
    console.log("         WHATSAPP_ACCESS_TOKEN=...");
    console.log("      3. Re-run: npm run whatsapp:check\n");
    return;
  }

  console.log("\n🔌 Live mode — verifying against the Graph API (no message sent)…\n");
  const client = new LiveWhatsAppClient(config);
  const result = await client.verifyCredentials();
  if (result.ok) {
    console.log("✅ Credentials valid.");
    console.log(`   Display number: ${result.displayPhoneNumber ?? "(unknown)"}`);
    console.log(`   Verified name:  ${result.verifiedName ?? "(unknown)"}\n`);
  } else {
    console.log("❌ Credentials rejected by Meta.");
    console.log(`   ${result.error}`);
    console.log("   Check the token scopes (whatsapp_business_messaging) and the phone number id.\n");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
