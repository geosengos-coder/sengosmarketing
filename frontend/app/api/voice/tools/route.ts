import { NextResponse } from "next/server";
import { executeTool, verifyWebhookSecret } from "@operatoros/voice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The tool-execution webhook Retell calls mid-conversation (ADR-0017). Auth is the
 * per-session secret embedded in the URL we registered when the session was
 * created — cheap but sufficient for a demo endpoint; not a bearer of tenant data.
 */
export async function POST(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session") ?? "";
  const secret = url.searchParams.get("secret") ?? "";

  if (!verifyWebhookSecret(sessionId, secret)) {
    return NextResponse.json({ result: "Unauthorized." }, { status: 401 });
  }

  let body: { name?: string; args?: Record<string, unknown> } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ result: "I couldn't process that request." }, { status: 400 });
  }

  const toolName = body.name ?? "";
  const args = body.args ?? {};
  const result = await executeTool(sessionId, toolName, args);
  return NextResponse.json(result);
}
