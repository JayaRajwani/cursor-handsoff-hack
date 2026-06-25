import type { IncomingMessage, ServerResponse } from "node:http";
import { runHackOS } from "../src/orchestration/HackOSApiOrchestrator.js";

type RequestBody = {
  goal?: unknown;
};

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed. Use POST." });
    return;
  }

  let body: RequestBody;
  try {
    body = JSON.parse(await readBody(request)) as RequestBody;
  } catch {
    sendJson(response, 400, { error: "Request body must be valid JSON." });
    return;
  }

  if (typeof body.goal !== "string" || body.goal.trim().length === 0) {
    sendJson(response, 400, { error: "Request body must include a non-empty string goal." });
    return;
  }

  const result = await runHackOS(body.goal.trim());
  sendJson(response, 200, { ok: true, data: result });
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(payload));
}

function setCorsHeaders(response: ServerResponse): void {
  response.setHeader("access-control-allow-origin", process.env.FRONTEND_ORIGIN ?? "*");
  response.setHeader("access-control-allow-methods", "POST, OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type, authorization");
  response.setHeader("access-control-max-age", "86400");
}
