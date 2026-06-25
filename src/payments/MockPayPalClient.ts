import { CaptureError } from "./errors.js";
import type {
  CreateOrderParams,
  PayPalClient,
  PayPalOrder,
  WebhookHeaders,
} from "./PayPalClient.js";
import type { Currency } from "./types.js";

export interface MockPayPalOptions {
  /** Base URL for fabricated checkout links. */
  mockBaseUrl?: string;
  /** Force capture to fail (simulate denied payment). */
  failCapture?: boolean;
  /** Override the captured amount to exercise amount-mismatch handling. */
  captureAmountOverride?: number;
  /** Override the captured currency to exercise currency-mismatch handling. */
  captureCurrencyOverride?: Currency;
}

interface MockOrderState {
  id: string;
  status: string;
  paymentIntentId: string;
  amount: number;
  currency: Currency;
}

const DEFAULT_BASE = "http://localhost:3000";

/**
 * Deterministic in-process stand-in for the PayPal Orders API. No network
 * calls. Lets the full sponsorship flow run locally and lets tests force
 * success, failure, cancellation, and signature failures.
 */
export class MockPayPalClient implements PayPalClient {
  readonly mode = "mock" as const;
  private orders = new Map<string, MockOrderState>();
  private seq = 0;
  private options: MockPayPalOptions;

  constructor(options: MockPayPalOptions = {}) {
    this.options = options;
  }

  private nextId(): string {
    this.seq += 1;
    return `MOCK-ORDER-${this.seq.toString().padStart(6, "0")}`;
  }

  private baseUrl(): string {
    return this.options.mockBaseUrl ?? DEFAULT_BASE;
  }

  async createOrder(params: CreateOrderParams): Promise<PayPalOrder> {
    const id = this.nextId();
    this.orders.set(id, {
      id,
      status: "CREATED",
      paymentIntentId: params.paymentIntentId,
      amount: params.amount,
      currency: params.currency,
    });
    const checkoutUrl = `${this.baseUrl()}/mock-paypal/checkout/${params.paymentIntentId}`;
    return {
      id,
      status: "CREATED",
      links: [
        { rel: "self", href: `${this.baseUrl()}/v2/checkout/orders/${id}`, method: "GET" },
        { rel: "approve", href: checkoutUrl, method: "GET" },
        {
          rel: "capture",
          href: `${this.baseUrl()}/v2/checkout/orders/${id}/capture`,
          method: "POST",
        },
      ],
    };
  }

  async captureOrder(orderId: string): Promise<PayPalOrder> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new CaptureError(`Unknown mock order: ${orderId}`);
    }
    if (this.options.failCapture) {
      order.status = "DECLINED";
      throw new CaptureError("Mock capture declined (failCapture enabled)", { orderId });
    }
    order.status = "COMPLETED";
    return {
      id: order.id,
      status: "COMPLETED",
      links: [],
      capturedAmount: this.options.captureAmountOverride ?? order.amount,
      capturedCurrency: this.options.captureCurrencyOverride ?? order.currency,
    };
  }

  async getOrder(orderId: string): Promise<PayPalOrder> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new CaptureError(`Unknown mock order: ${orderId}`);
    }
    return { id: order.id, status: order.status, links: [] };
  }

  /** Returns false only when a header explicitly flags an invalid signature. */
  async verifyWebhookSignature(headers: WebhookHeaders, _rawBody: string): Promise<boolean> {
    return headers["paypal-mock-signature"] !== "invalid";
  }
}
