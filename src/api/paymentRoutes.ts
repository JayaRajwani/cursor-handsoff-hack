/**
 * Framework-agnostic HTTP route handlers for the PayPal payment flow.
 *
 * The repo ships no web framework, so these handlers take a tiny normalised
 * request shape and return `{ status, json }`. `dispatch()` maps method+path to
 * a handler; adapt to Express/Next/Fastify by forwarding their req/res into it.
 *
 * Routes (as specified):
 *   POST /api/payments/paypal/create-order
 *   POST /api/payments/paypal/capture-order
 *   GET  /api/payments/:paymentIntentId
 *   POST /api/webhooks/paypal
 *   POST /api/payments/:paymentIntentId/approve-send-link
 */
import { PaymentError } from "../payments/errors.js";
import type { PaymentService } from "../payments/PaymentService.js";
import type { WebhookHeaders } from "../payments/PayPalClient.js";

export interface ApiRequest {
  method: string;
  path: string;
  headers: WebhookHeaders;
  /** Parsed JSON body (for JSON routes). */
  body?: unknown;
  /** Raw request body string (required for webhook signature verification). */
  rawBody?: string;
}

export interface ApiResponse {
  status: number;
  json: unknown;
}

function ok(json: unknown, status = 200): ApiResponse {
  return { status, json };
}

function fail(err: unknown): ApiResponse {
  if (err instanceof PaymentError) {
    return { status: err.httpStatus, json: err.toJSON() };
  }
  // Never leak internals/credentials in error responses.
  return { status: 500, json: { error: { code: "internal_error", message: "Internal error" } } };
}

function requireString(body: unknown, field: string): string {
  if (typeof body !== "object" || body === null) {
    throw new PaymentError("invalid_request", `Missing request body`, 400);
  }
  const value = (body as Record<string, unknown>)[field];
  if (typeof value !== "string" || !value) {
    throw new PaymentError("invalid_request", `Missing or invalid field: ${field}`, 400);
  }
  return value;
}

export class PaymentApi {
  constructor(private service: PaymentService) {}

  async createOrder(req: ApiRequest): Promise<ApiResponse> {
    try {
      const paymentIntentId = requireString(req.body, "paymentIntentId");
      const intent = await this.service.createOrder(paymentIntentId);
      return ok({
        paymentIntentId: intent.id,
        providerOrderId: intent.providerOrderId,
        checkoutUrl: intent.checkoutUrl,
        status: intent.status,
      });
    } catch (err) {
      return fail(err);
    }
  }

  async captureOrder(req: ApiRequest): Promise<ApiResponse> {
    try {
      const paymentIntentId = requireString(req.body, "paymentIntentId");
      const intent = await this.service.captureOrder(paymentIntentId);
      return ok({ paymentIntentId: intent.id, status: intent.status });
    } catch (err) {
      return fail(err);
    }
  }

  getPayment(paymentIntentId: string): ApiResponse {
    try {
      const intent = this.service.getStore().getIntent(paymentIntentId);
      if (!intent) {
        return { status: 404, json: { error: { code: "payment_not_found", message: "Payment intent not found" } } };
      }
      return ok(intent);
    } catch (err) {
      return fail(err);
    }
  }

  async webhook(req: ApiRequest): Promise<ApiResponse> {
    try {
      const rawBody = req.rawBody ?? (typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}));
      const event = await this.service.handleWebhook(req.headers, rawBody);
      return ok({ received: true, status: event.status, eventType: event.eventType });
    } catch (err) {
      return fail(err);
    }
  }

  approveSendLink(paymentIntentId: string): ApiResponse {
    try {
      const { commitment, message } = this.service.approveSendLink(paymentIntentId);
      return ok({
        paymentIntentId,
        commitmentStatus: commitment.status,
        sponsorName: commitment.sponsorName,
        message,
        approvalStatus: "approved",
      });
    } catch (err) {
      return fail(err);
    }
  }

  /** Route method+path to a handler. Returns 404 for unmatched routes. */
  async dispatch(req: ApiRequest): Promise<ApiResponse> {
    const { method, path } = req;

    if (method === "POST" && path === "/api/payments/paypal/create-order") {
      return this.createOrder(req);
    }
    if (method === "POST" && path === "/api/payments/paypal/capture-order") {
      return this.captureOrder(req);
    }
    if (method === "POST" && path === "/api/webhooks/paypal") {
      return this.webhook(req);
    }

    const approveMatch = path.match(/^\/api\/payments\/([^/]+)\/approve-send-link$/);
    if (method === "POST" && approveMatch) {
      return this.approveSendLink(decodeURIComponent(approveMatch[1]!));
    }

    const getMatch = path.match(/^\/api\/payments\/([^/]+)$/);
    if (method === "GET" && getMatch) {
      return this.getPayment(decodeURIComponent(getMatch[1]!));
    }

    return { status: 404, json: { error: { code: "not_found", message: `No route for ${method} ${path}` } } };
  }
}
