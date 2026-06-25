import type { PayPalConfig } from "./config.js";
import { OrderCreationError, CaptureError } from "./errors.js";
import { toPayPalAmount, type Currency } from "./types.js";

export interface PayPalLink {
  rel: string;
  href: string;
  method: string;
}

export interface PayPalOrder {
  id: string;
  status: string; // CREATED | APPROVED | COMPLETED | VOIDED | ...
  links: PayPalLink[];
  /** Captured amount, populated after capture (major units). */
  capturedAmount?: number;
  capturedCurrency?: Currency;
}

export interface CreateOrderParams {
  paymentIntentId: string;
  amount: number;
  currency: Currency;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface WebhookHeaders {
  [key: string]: string | undefined;
}

/**
 * Thin transport over the PayPal Checkout Orders API. The PaymentService owns
 * all business rules; a client only speaks PayPal's wire protocol. Both the
 * live and mock clients implement this interface.
 */
export interface PayPalClient {
  readonly mode: PayPalConfig["mode"];
  createOrder(params: CreateOrderParams): Promise<PayPalOrder>;
  captureOrder(orderId: string): Promise<PayPalOrder>;
  getOrder(orderId: string): Promise<PayPalOrder>;
  verifyWebhookSignature(headers: WebhookHeaders, rawBody: string): Promise<boolean>;
}

/** Extract the buyer-facing approval link from a PayPal order. */
export function approvalLink(order: PayPalOrder): string | null {
  return order.links.find((l) => l.rel === "approve" || l.rel === "payer-action")?.href ?? null;
}

/** Real PayPal REST client (sandbox or live). Uses global fetch; no SDK dependency. */
export class LivePayPalClient implements PayPalClient {
  readonly mode: PayPalConfig["mode"];
  private config: PayPalConfig;
  private token: { value: string; expiresAt: number } | null = null;

  constructor(config: PayPalConfig) {
    this.config = config;
    this.mode = config.mode;
  }

  private async accessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAt > now + 60_000) {
      return this.token.value;
    }
    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString("base64");
    const res = await fetch(`${this.config.apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) {
      throw new OrderCreationError(`OAuth token request failed (${res.status})`);
    }
    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: json.access_token, expiresAt: now + json.expires_in * 1000 };
    return this.token.value;
  }

  async createOrder(params: CreateOrderParams): Promise<PayPalOrder> {
    const token = await this.accessToken();
    const res = await fetch(`${this.config.apiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        // Idempotency: PayPal dedupes orders sharing a request id.
        "PayPal-Request-Id": params.paymentIntentId,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: params.paymentIntentId,
            description: params.description,
            amount: {
              currency_code: params.currency,
              value: toPayPalAmount(params.amount),
            },
          },
        ],
        application_context: {
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
          user_action: "PAY_NOW",
        },
      }),
    });
    if (!res.ok) {
      throw new OrderCreationError(`HTTP ${res.status}`, { body: await safeBody(res) });
    }
    return (await res.json()) as PayPalOrder;
  }

  async captureOrder(orderId: string): Promise<PayPalOrder> {
    const token = await this.accessToken();
    const res = await fetch(`${this.config.apiBase}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      throw new CaptureError(`HTTP ${res.status}`, { body: await safeBody(res) });
    }
    const json = (await res.json()) as RawCaptureResponse;
    const capture = json.purchase_units?.[0]?.payments?.captures?.[0];
    return {
      id: json.id,
      status: json.status,
      links: json.links ?? [],
      capturedAmount: capture ? Number(capture.amount.value) : undefined,
      capturedCurrency: capture ? (capture.amount.currency_code as Currency) : undefined,
    };
  }

  async getOrder(orderId: string): Promise<PayPalOrder> {
    const token = await this.accessToken();
    const res = await fetch(`${this.config.apiBase}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new OrderCreationError(`getOrder HTTP ${res.status}`, { body: await safeBody(res) });
    }
    return (await res.json()) as PayPalOrder;
  }

  async verifyWebhookSignature(headers: WebhookHeaders, rawBody: string): Promise<boolean> {
    const token = await this.accessToken();
    const res = await fetch(`${this.config.apiBase}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_algo: headers["paypal-auth-algo"],
        cert_url: headers["paypal-cert-url"],
        transmission_id: headers["paypal-transmission-id"],
        transmission_sig: headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"],
        webhook_id: this.config.webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { verification_status: string };
    return json.verification_status === "SUCCESS";
  }
}

interface RawCaptureResponse {
  id: string;
  status: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{ amount: { value: string; currency_code: string } }>;
    };
  }>;
}

async function safeBody(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "<unreadable>";
  }
}
