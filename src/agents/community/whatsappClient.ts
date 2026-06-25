import type { WhatsAppClient } from "./whatsapp.js";
import { MockWhatsAppClient } from "./whatsapp.js";

/**
 * Live transport for the WhatsApp Business Cloud API (Meta Graph API), plus
 * the config loader and factory that switch between mock and live exactly the
 * way the PayPal integration does. The Community Agent owns the plan; a client
 * only speaks WhatsApp's wire protocol.
 *
 * What the Cloud API can and cannot do:
 * - sendTemplate / registerTemplate  → fully supported here.
 * - createCommunity / createGroup     → NOT exposed by the Cloud API. Group and
 *   Community setup is operator-assisted (or via a BSP), so the live client
 *   throws a clear, actionable error instead of pretending.
 */

export type WhatsAppMode = "mock" | "live";

export interface WhatsAppConfig {
  mode: WhatsAppMode;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
  defaultCountryCode: string;
  templateLanguage: string;
  apiVersion: string;
  /** Graph API base including version, e.g. https://graph.facebook.com/v21.0. Empty for mock. */
  apiBase: string;
}

export class WhatsAppConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhatsAppConfigError";
  }
}

export class WhatsAppApiError extends Error {
  readonly status?: number;
  readonly body?: string;
  constructor(message: string, details: { status?: number; body?: string } = {}) {
    super(message);
    this.name = "WhatsAppApiError";
    this.status = details.status;
    this.body = details.body;
  }
}

export class WhatsAppUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhatsAppUnsupportedError";
  }
}

const GRAPH = "https://graph.facebook.com";
const DEFAULT_API_VERSION = "v21.0";

export interface LoadConfigOptions {
  /** Treat missing credentials as fatal instead of falling back to mock mode. */
  requireCredentials?: boolean;
  /** Emit a console warning when falling back to mock mode. Defaults to true. */
  warn?: boolean;
}

/**
 * Resolve WhatsApp configuration from environment variables.
 *
 * Resolution rules (mirrors loadPayPalConfig):
 * - WHATSAPP_MODE=mock              → mock mode (no network calls).
 * - WHATSAPP_MODE=live              → live mode; requires phone number id + token.
 * - unset, credentials present      → live.
 * - unset, credentials missing      → mock.
 * - live without credentials in dev → falls back to mock (unless requireCredentials).
 * - live without credentials in prod→ throws WhatsAppConfigError.
 */
export function loadWhatsAppConfig(
  env: NodeJS.ProcessEnv = process.env,
  options: LoadConfigOptions = {},
): WhatsAppConfig {
  const warn = options.warn ?? true;
  const rawMode = (env.WHATSAPP_MODE ?? "").toLowerCase();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID ?? "";
  const accessToken = env.WHATSAPP_ACCESS_TOKEN ?? "";
  const apiVersion = env.WHATSAPP_API_VERSION ?? DEFAULT_API_VERSION;

  // Placeholder values written by the scaffold count as "no real credentials".
  const isPlaceholder = (v: string) => v === "" || v.startsWith("placeholder_") || v.startsWith("your_");
  const hasCredentials = !isPlaceholder(phoneNumberId) && !isPlaceholder(accessToken);

  let mode: WhatsAppMode;
  if (rawMode === "mock") {
    mode = "mock";
  } else if (rawMode === "live") {
    mode = "live";
  } else {
    mode = hasCredentials ? "live" : "mock";
  }

  if (mode === "live" && !hasCredentials) {
    const isProd = env.NODE_ENV === "production" || options.requireCredentials;
    if (isProd) {
      throw new WhatsAppConfigError(
        "WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN are required for live mode.",
      );
    }
    if (warn) {
      console.warn(
        "[whatsapp] No real credentials found — falling back to mock mode. Set WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN (and WHATSAPP_MODE=live) to send for real.",
      );
    }
    mode = "mock";
  }

  return {
    mode,
    phoneNumberId,
    businessAccountId: env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? "",
    accessToken,
    appSecret: env.WHATSAPP_APP_SECRET ?? "",
    verifyToken: env.WHATSAPP_VERIFY_TOKEN ?? "",
    defaultCountryCode: env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? "+44",
    templateLanguage: env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_GB",
    apiVersion,
    apiBase: mode === "live" ? `${GRAPH}/${apiVersion}` : "",
  };
}

export interface CredentialCheck {
  ok: boolean;
  displayPhoneNumber?: string;
  verifiedName?: string;
  error?: string;
}

/** Real WhatsApp Business Cloud API client. Uses global fetch; no SDK dependency. */
export class LiveWhatsAppClient implements WhatsAppClient {
  readonly mode = "live" as const;
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    if (!config.phoneNumberId || !config.accessToken) {
      throw new WhatsAppConfigError("LiveWhatsAppClient requires phoneNumberId and accessToken.");
    }
    this.config = config;
  }

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  /** Validate the token + phone number id against the Graph API (cheap GET). */
  async verifyCredentials(): Promise<CredentialCheck> {
    const url = `${this.config.apiBase}/${this.config.phoneNumberId}?fields=verified_name,display_phone_number,quality_rating`;
    const res = await fetch(url, { headers: this.authHeaders() });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${await safeBody(res)}` };
    }
    const json = (await res.json()) as {
      display_phone_number?: string;
      verified_name?: string;
    };
    return {
      ok: true,
      displayPhoneNumber: json.display_phone_number,
      verifiedName: json.verified_name,
    };
  }

  async createCommunity(): Promise<{ communityId: string }> {
    throw new WhatsAppUnsupportedError(
      "The WhatsApp Cloud API cannot create Communities programmatically. " +
        "Create the Community and its groups in the WhatsApp app (or via a BSP such as " +
        "Twilio / 360dialog), then drive messaging through this client.",
    );
  }

  async createGroup(): Promise<{ groupId: string; inviteLink: string }> {
    throw new WhatsAppUnsupportedError(
      "The WhatsApp Cloud API cannot create groups programmatically. Use the WhatsApp " +
        "Communities UI or a BSP, then store the group invite links in your own datastore.",
    );
  }

  /** Register a message template with Meta for approval. POST /{waba-id}/message_templates */
  async registerTemplate(template: {
    name: string;
    category: "UTILITY" | "MARKETING";
    language: string;
    body: string;
  }): Promise<{ templateId: string; status: "PENDING" | "APPROVED" }> {
    if (!this.config.businessAccountId) {
      throw new WhatsAppConfigError("WHATSAPP_BUSINESS_ACCOUNT_ID is required to register templates.");
    }
    const res = await fetch(`${this.config.apiBase}/${this.config.businessAccountId}/message_templates`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify({
        name: template.name,
        category: template.category,
        language: template.language || this.config.templateLanguage,
        components: [{ type: "BODY", text: template.body }],
      }),
    });
    if (!res.ok) {
      throw new WhatsAppApiError(`registerTemplate failed (HTTP ${res.status})`, {
        status: res.status,
        body: await safeBody(res),
      });
    }
    const json = (await res.json()) as { id: string; status?: string };
    return {
      templateId: json.id,
      status: json.status === "APPROVED" ? "APPROVED" : "PENDING",
    };
  }

  /**
   * Send a template message. In live mode `recipient` is a single E.164 phone
   * number (the Cloud API addresses individuals, not group ids); broadcasting
   * means iterating your opted-in audience. POST /{phone-number-id}/messages
   */
  async sendTemplate(
    recipient: string,
    templateName: string,
    variables: string[],
  ): Promise<{ messageId: string }> {
    const components = variables.length
      ? [{ type: "body", parameters: variables.map((text) => ({ type: "text", text })) }]
      : [];
    const res = await fetch(`${this.config.apiBase}/${this.config.phoneNumberId}/messages`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: this.config.templateLanguage },
          components,
        },
      }),
    });
    if (!res.ok) {
      throw new WhatsAppApiError(`sendTemplate failed (HTTP ${res.status})`, {
        status: res.status,
        body: await safeBody(res),
      });
    }
    const json = (await res.json()) as { messages?: Array<{ id: string }> };
    const messageId = json.messages?.[0]?.id ?? "";
    return { messageId };
  }

  /**
   * Opt-in/out is recorded in your own datastore, not at Meta — consent must be
   * captured before any MARKETING send. Wire this to your CRM/Airtable. Kept as
   * a no-op so the interface is satisfied without inventing a Meta endpoint.
   */
  async recordOptIn(phone: string, consent: boolean): Promise<void> {
    console.warn(
      `[whatsapp] recordOptIn(${phone}, ${consent}) — persist consent in your own datastore; the Cloud API has no opt-in endpoint.`,
    );
  }
}

/**
 * Return the right client for the current config. Defaults to reading the
 * environment, so `createWhatsAppClient()` "just works" in any mode.
 */
export function createWhatsAppClient(config: WhatsAppConfig = loadWhatsAppConfig()): WhatsAppClient {
  return config.mode === "live" ? new LiveWhatsAppClient(config) : new MockWhatsAppClient();
}

async function safeBody(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "<unreadable>";
  }
}
