import type { IncomingMessage, ServerResponse } from "node:http";
import { runHackOS } from "../src/orchestration/HackOSApiOrchestrator.js";

type RequestBody = {
  goal?: unknown;
};

export default async function handler(request: IncomingMessage, response: ServerResponse) {
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
