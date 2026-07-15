import { NextResponse } from "next/server";
import { BusinessDNASchema } from "@operatoros/dna";
import { getVoiceProvider } from "@operatoros/voice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simple per-IP sliding-window guard against session-creation abuse (ADR-0013/0017
// cost & abuse requirements). In-memory, single-process — sufficient for a demo;
// a real deployment would move this to Redis alongside the session store.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function resolvePublicBaseUrl(req: Request): string {
  // Retell's servers must be able to reach this over the public internet to call
  // tools mid-conversation. In production, set PUBLIC_APP_URL explicitly; a bare
  // localhost dev server needs a tunnel (e.g. ngrok) for live tool calls to work.
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many sessions started — please wait a few minutes." },
      { status: 429 },
    );
  }

  const provider = getVoiceProvider();
  if (!provider) {
    // Honest unavailability, never a fake conversation (ADR-0017).
    return NextResponse.json(
      {
        error: "voice_provider_unavailable",
        message: "The live voice engine isn't connected yet. Add a Retell API key to activate it.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Invalid request body." }, { status: 400 });
  }

  const parsed = BusinessDNASchema.safeParse((body as Record<string, unknown>)?.dna);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_dna", message: "No valid Business DNA was provided." },
      { status: 400 },
    );
  }
  const role = parsed.data.employees[0]?.role ?? "receptionist";

  try {
    const session = await provider.createSession({
      dna: parsed.data,
      role,
      publicBaseUrl: resolvePublicBaseUrl(req),
    });
    return NextResponse.json(session);
  } catch (err) {
    return NextResponse.json(
      { error: "provider_error", message: String(err instanceof Error ? err.message : err) },
      { status: 502 },
    );
  }
}
