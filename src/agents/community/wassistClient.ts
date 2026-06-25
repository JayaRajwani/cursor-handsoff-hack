/**
 * Wassist client — the WhatsApp provider HackOS actually uses.
 *
 * Verified against the live API (June 2026):
 *   Base URL: https://backend.wassist.app/api/v1
 *   Auth:     header  X-API-Key: <token>
 *   Health:   GET /agents/  → 200 { count, results: [...] }
 *
 * Note: the published OpenAPI spec lists `Authorization: Token` and a
 * `api.wassist.app` host, but the live service rejects those — `X-API-Key`
 * against `backend.wassist.app` is what works. Both are overridable via env.
 *
 * Messaging model: Wassist sends into a *conversation* (not a raw phone
 * number). Resolve/create the conversation for a contact, then post messages.
 */

export interface WassistConfig {
  apiKey: string;
  baseUrl: string;
  /** Header used to carry the key. Defaults to the verified "X-API-Key". */
  authHeader: string;
  hasKey: boolean;
}

export class WassistConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WassistConfigError";
  }
}

export class WassistApiError extends Error {
  readonly status?: number;
  readonly body?: string;
  constructor(message: string, details: { status?: number; body?: string } = {}) {
    super(message);
    this.name = "WassistApiError";
    this.status = details.status;
    this.body = details.body;
  }
}

const DEFAULT_BASE_URL = "https://backend.wassist.app/api/v1";
const DEFAULT_AUTH_HEADER = "X-API-Key";

function isPlaceholder(v: string): boolean {
  return v === "" || v.startsWith("placeholder_") || v.startsWith("your_");
}

export function loadWassistConfig(env: NodeJS.ProcessEnv = process.env): WassistConfig {
  const apiKey = env.WASSIST_API_KEY ?? "";
  const baseUrl = (env.WASSIST_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  return {
    apiKey,
    baseUrl,
    authHeader: env.WASSIST_AUTH_HEADER ?? DEFAULT_AUTH_HEADER,
    hasKey: !isPlaceholder(apiKey),
  };
}

export interface CredentialCheck {
  ok: boolean;
  agentCount?: number;
  status?: number;
  error?: string;
}

export interface WassistAgent {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface WassistMessageResult {
  messageId: string;
  raw: unknown;
}

export class WassistClient {
  private config: WassistConfig;

  constructor(config: WassistConfig = loadWassistConfig()) {
    if (!config.hasKey) {
      throw new WassistConfigError(
        "WASSIST_API_KEY is missing or a placeholder. Set it in .env.local.",
      );
    }
    this.config = config;
  }

  private headers(): Record<string, string> {
    return {
      [this.config.authHeader]: this.config.apiKey,
      "Content-Type": "application/json",
    };
  }

  private url(path: string): string {
    return `${this.config.baseUrl}/${path.replace(/^\/+/, "")}`;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(this.url(path), {
      method,
      headers: this.headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      throw new WassistApiError(`${method} ${path} failed (HTTP ${res.status})`, {
        status: res.status,
        body: await safeBody(res),
      });
    }
    return (await res.json()) as T;
  }

  /** Lightweight credential check: GET /agents/ (read-only, sends nothing). */
  async verifyCredentials(): Promise<CredentialCheck> {
    const res = await fetch(this.url("agents/"), { headers: this.headers() });
    if (!res.ok) {
      return { ok: false, status: res.status, error: await safeBody(res) };
    }
    const json = (await res.json()) as { count?: number; results?: unknown[] };
    return { ok: true, status: res.status, agentCount: json.count ?? json.results?.length ?? 0 };
  }

  async listAgents(): Promise<WassistAgent[]> {
    const json = await this.request<{ results?: WassistAgent[] }>("GET", "agents/");
    return json.results ?? [];
  }

  async listConversations(): Promise<Array<{ id: string; [k: string]: unknown }>> {
    const json = await this.request<{ results?: Array<{ id: string }> }>("GET", "conversations/");
    return json.results ?? [];
  }

  async getConversation(id: string): Promise<{ id: string; status?: string; [k: string]: unknown }> {
    return this.request("GET", `conversations/${id}/`);
  }

  /** Send a free-text message into an active conversation. */
  async sendText(conversationId: string, body: string): Promise<WassistMessageResult> {
    const raw = await this.request<{ id?: string; messageId?: string }>(
      "POST",
      `conversations/${conversationId}/messages/`,
      { type: "text", text: { body } },
    );
    return { messageId: raw.id ?? raw.messageId ?? "", raw };
  }

  /** Send a pre-approved template message into a conversation. */
  async sendTemplate(
    conversationId: string,
    templateName: string,
    variables: Record<string, string> = {},
  ): Promise<WassistMessageResult> {
    const raw = await this.request<{ id?: string; messageId?: string }>(
      "POST",
      `conversations/${conversationId}/messages/`,
      { type: "template", templateName, variables },
    );
    return { messageId: raw.id ?? raw.messageId ?? "", raw };
  }
}

async function safeBody(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "<unreadable>";
  }
}
