import { runHackOS } from "../../../src/orchestration/HackOSApiOrchestrator.js";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const goal = typeof body === "object" && body !== null && "goal" in body ? body.goal : undefined;

  if (typeof goal !== "string" || goal.trim().length === 0) {
    return json({ error: "Request body must include a non-empty string goal." }, 400);
  }

  const result = await runHackOS(goal.trim());
  return json({ ok: true, data: result });
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}
