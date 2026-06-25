/**
 * setup-paypal-sandbox.ts
 *
 * Local setup helper: reads a PayPal sandbox credential CSV and generates a
 * local `.env.local` file for development.
 *
 * The CSV is treated as a secret. It is never committed, and the script never
 * prints the client secret (or any password) to the console.
 *
 * Usage:
 *   npm run setup:paypal                       # uses default CSV path
 *   npm run setup:paypal -- /path/to/kit.csv   # explicit path
 *   PAYPAL_KIT_CSV=/path/to/kit.csv npm run setup:paypal
 *
 * The default path matches the provisioning kit location (`/mnt/data/...`).
 * On machines where the kit lives elsewhere, pass the path as an argument or
 * set PAYPAL_KIT_CSV.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const DEFAULT_CSV_PATH = '/mnt/data/paypal-sandbox-kit.csv';

const REQUIRED_COLUMNS = [
  'assigned_to',
  'personal_account_id',
  'personal_email',
  'personal_password',
  'business_account_id',
  'business_email',
  'business_password',
  'client_id',
  'client_secret',
] as const;

type Row = Record<string, string>;

/** Minimal RFC-4180-ish CSV parser (handles quoted fields, commas, CRLF). */
function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      record.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      record.push(field);
      field = '';
      // Skip fully-blank lines.
      if (record.length > 1 || record[0] !== '') rows.push(record);
      record = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || record.length > 0) {
    record.push(field);
    if (record.length > 1 || record[0] !== '') rows.push(record);
  }

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cols) => {
    const obj: Row = {};
    header.forEach((key, idx) => {
      obj[key] = (cols[idx] ?? '').trim();
    });
    return obj;
  });
}

/** Mask middle of a string, keeping a few leading/trailing chars for sanity checks. */
function mask(value: string, keepStart = 4, keepEnd = 4): string {
  if (!value) return '(empty)';
  if (value.length <= keepStart + keepEnd) return '*'.repeat(value.length);
  return `${value.slice(0, keepStart)}${'*'.repeat(Math.max(4, value.length - keepStart - keepEnd))}${value.slice(-keepEnd)}`;
}

/** Mask an email as f****r@domain.com. */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return mask(email);
  const [local, domain] = email.split('@');
  const maskedLocal =
    local.length <= 2 ? '*'.repeat(local.length) : `${local[0]}${'*'.repeat(local.length - 2)}${local.slice(-1)}`;
  return `${maskedLocal}@${domain}`;
}

/** Upsert KEY=VALUE pairs into an existing dotenv-style file body. */
function upsertEnv(existing: string, updates: Record<string, string>): string {
  const lines = existing.length ? existing.split('\n') : [];
  const seen = new Set<string>();

  const out = lines.map((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (m && Object.prototype.hasOwnProperty.call(updates, m[1])) {
      seen.add(m[1]);
      return `${m[1]}=${updates[m[1]]}`;
    }
    return line;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) out.push(`${key}=${value}`);
  }

  let body = out.join('\n').replace(/\n{3,}/g, '\n\n');
  if (!body.endsWith('\n')) body += '\n';
  return body;
}

function main() {
  const csvPath = process.argv[2] || process.env.PAYPAL_KIT_CSV || DEFAULT_CSV_PATH;

  if (!existsSync(csvPath)) {
    console.error(`✗ CSV not found at: ${csvPath}`);
    console.error('  Pass a path: npm run setup:paypal -- /path/to/paypal-sandbox-kit.csv');
    console.error('  Or set PAYPAL_KIT_CSV=/path/to/paypal-sandbox-kit.csv');
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(csvPath, 'utf8'));

  if (rows.length === 0) {
    console.error('✗ CSV has a header but no data rows.');
    process.exit(1);
  }

  // Validate required columns exist.
  const present = new Set(Object.keys(rows[0]));
  const missing = REQUIRED_COLUMNS.filter((c) => !present.has(c));
  if (missing.length > 0) {
    console.error(`✗ CSV is missing required columns: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Extract the first row.
  const row = rows[0];

  // Validate the values we actually need are non-empty.
  const needed = ['client_id', 'client_secret', 'business_email', 'personal_email'] as const;
  const empty = needed.filter((k) => !row[k]);
  if (empty.length > 0) {
    console.error(`✗ First row is missing values for: ${empty.join(', ')}`);
    process.exit(1);
  }

  const envValues: Record<string, string> = {
    PAYPAL_CLIENT_ID: row.client_id,
    PAYPAL_CLIENT_SECRET: row.client_secret,
    PAYPAL_MODE: 'sandbox',
    PAYPAL_BUSINESS_EMAIL: row.business_email,
    PAYPAL_SANDBOX_BUYER_EMAIL: row.personal_email,
    PAYPAL_WEBHOOK_ID: 'placeholder_for_now',
    PAYPAL_RETURN_URL: 'http://localhost:3000/payments/paypal/success',
    PAYPAL_CANCEL_URL: 'http://localhost:3000/payments/paypal/cancel',
  };

  const envPath = resolve(REPO_ROOT, '.env.local');
  const existing = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  const body = upsertEnv(existing, envValues);
  writeFileSync(envPath, body, { mode: 0o600 });

  // Ensure .env.local is gitignored.
  ensureGitignored();

  // Safe, masked summary only. Never print the secret or any password.
  console.log('✓ Wrote .env.local with PayPal sandbox configuration');
  console.log(`  Assigned to:        ${row.assigned_to || '(unspecified)'}`);
  console.log(`  PAYPAL_MODE:        sandbox`);
  console.log(`  PAYPAL_CLIENT_ID:   ${mask(row.client_id)}`);
  console.log(`  PAYPAL_CLIENT_SECRET: (hidden)`);
  console.log(`  Business (merchant): ${maskEmail(row.business_email)}`);
  console.log(`  Buyer (personal):    ${maskEmail(row.personal_email)}`);
  console.log(`  PAYPAL_WEBHOOK_ID:   placeholder_for_now  (set after creating a webhook)`);
  console.log('');
  console.log('  .env.local is gitignored. Do not commit it or the source CSV.');
}

function ensureGitignored() {
  const gitignorePath = resolve(REPO_ROOT, '.gitignore');
  const entries = ['.env', '.env.local', '.env.*.local', 'paypal-sandbox-kit.csv'];
  let content = existsSync(gitignorePath) ? readFileSync(gitignorePath, 'utf8') : '';
  const lines = new Set(content.split('\n').map((l) => l.trim()));
  const toAdd = entries.filter((e) => !lines.has(e));
  if (toAdd.length === 0) return;
  if (content.length && !content.endsWith('\n')) content += '\n';
  content += `${toAdd.join('\n')}\n`;
  writeFileSync(gitignorePath, content);
}

main();
