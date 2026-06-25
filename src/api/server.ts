/**
 * Minimal node:http server exposing the PayPal payment routes, the internal
 * approval view, and a mock checkout page. No framework dependency.
 *
 * Run: npm run paypal:serve   (PAYPAL_MODE=mock works with no credentials)
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createPaymentService, type PaymentService } from "../payments/PaymentService.js";
import { PaymentApi, type ApiRequest } from "./paymentRoutes.js";
import { renderApprovalView } from "./approvalView.js";
import type { WebhookHeaders } from "../payments/PayPalClient.js";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, json: unknown): void {
  const body = JSON.stringify(json);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body);
}

function sendHtml(res: ServerResponse, status: number, html: string): void {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

export function createPaymentServer(service: PaymentService = createPaymentService()) {
  const api = new PaymentApi(service);

  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const path = url.pathname;
      const method = req.method ?? "GET";

      // Internal approval view (HTML): /payments/approve/:paymentIntentId
      const viewMatch = path.match(/^\/payments\/approve\/([^/]+)$/);
      if (method === "GET" && viewMatch) {
        const intentId = decodeURIComponent(viewMatch[1]!);
        const intent = service.getStore().getIntent(intentId);
        const commitment = service.getStore().getCommitmentByIntent(intentId);
        if (!intent) return sendHtml(res, 404, "<h1>Payment not found</h1>");
        return sendHtml(
          res,
          200,
          renderApprovalView({
            paymentIntentId: intent.id,
            sponsorName: intent.payerName,
            eventName: (intent.metadata.eventName as string) ?? intent.eventId,
            packageName: intent.packageName,
            amount: intent.amount,
            currency: intent.currency,
            status: intent.status,
            checkoutUrl: intent.checkoutUrl ?? "",
            messageDraft: (commitment?.notes.map((n) => n.note).join("\n")) || "Draft generated on link creation.",
          }),
        );
      }

      // Mock checkout page (mock mode only).
      const checkoutMatch = path.match(/^\/mock-paypal\/checkout\/([^/]+)$/);
      if (method === "GET" && checkoutMatch) {
        const intentId = decodeURIComponent(checkoutMatch[1]!);
        return sendHtml(
          res,
          200,
          `<!doctype html><meta charset="utf-8"><title>Mock PayPal Checkout</title>
           <body style="font-family:system-ui;max-width:420px;margin:60px auto">
           <h2>Mock PayPal Checkout</h2><p>Payment intent: <code>${intentId}</code></p>
           <p>This is a local stand-in. In real mode the sponsor approves on paypal.com.</p></body>`,
        );
      }

      const headers = req.headers as WebhookHeaders;
      const rawBody = method === "GET" || method === "HEAD" ? undefined : await readBody(req);
      let body: unknown;
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          body = rawBody;
        }
      }

      const apiReq: ApiRequest = { method, path, headers, body, rawBody };
      const result = await api.dispatch(apiReq);
      sendJson(res, result.status, result.json);
    } catch (err) {
      sendJson(res, 500, { error: { code: "internal_error", message: "Internal error" } });
    }
  });
}

// Start when run directly (tsx src/api/server.ts).
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const port = Number(process.env.PORT ?? 3000);
  const service = createPaymentService();
  createPaymentServer(service).listen(port, () => {
    console.log(`[paypal] HackOS payment server listening on http://localhost:${port} (mode: ${service.mode})`);
    console.log(`  POST /api/payments/paypal/create-order`);
    console.log(`  POST /api/payments/paypal/capture-order`);
    console.log(`  GET  /api/payments/:paymentIntentId`);
    console.log(`  POST /api/webhooks/paypal`);
    console.log(`  POST /api/payments/:paymentIntentId/approve-send-link`);
    console.log(`  GET  /payments/approve/:paymentIntentId  (operator approval view)`);
  });
}
