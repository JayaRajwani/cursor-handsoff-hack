#!/usr/bin/env tsx
/**
 * Verify the Wassist API key with a read-only call (sends no messages).
 *
 * Run: npm run wassist:check
 * Reads WASSIST_* from the environment (.env.local is loaded if present).
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
  const config = loadWassistConfig(process.env);

  console.log("\n📋 Wassist credential check\n");
  console.log(`  API key:     ${mask(config.apiKey)}`);
  console.log(`  Base URL:    ${config.baseUrl}`);
  console.log(`  Auth header: ${config.authHeader}`);

  if (!config.hasKey) {
    console.log("\n⚠️  No API key set. Add WASSIST_API_KEY to .env.local, then re-run.\n");
    process.exitCode = 1;
    return;
  }

  console.log("\n🔌 Verifying against the Wassist API (read-only GET /agents/)…\n");
  const client = new WassistClient(config);
  const result = await client.verifyCredentials();
  if (result.ok) {
    console.log("✅ API key valid.");
    console.log(`   Agents on this account: ${result.agentCount}`);
    if (result.agentCount === 0) {
      console.log("   (No agents yet — create one in the Wassist dashboard to start messaging.)");
    }
    console.log("");
  } else {
    console.log(`❌ Rejected (HTTP ${result.status}).`);
    console.log(`   ${result.error}`);
    console.log("   Check the key in Settings → API Keys, and the WASSIST_BASE_URL.\n");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
