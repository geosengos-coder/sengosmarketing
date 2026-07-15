import { streamBusinessDNA } from "@operatoros/ai";
import {
  IndustrySchema,
  type BusinessInput,
  type EmployeeRole,
  type ResolveOptions,
} from "@operatoros/dna";

// Needs the Node runtime (website fetch, OpenAI SDK, stream reader).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams real Business DNA generation events as NDJSON. The client renders whatever
 * arrives — it never knows whether a heuristic or OpenAI produced the events.
 */
export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    // empty body is fine; we default below
  }

  const businessName = String(body.businessName ?? "").slice(0, 120) || "Your Business";
  const websiteUrl = body.websiteUrl ? String(body.websiteUrl).slice(0, 300) : undefined;
  const city = body.city ? String(body.city).slice(0, 80) : undefined;
  const industry = IndustrySchema.safeParse(body.industry).success
    ? (body.industry as BusinessInput["industry"])
    : undefined;

  const input: BusinessInput = { businessName, websiteUrl, industry, city };
  const options: ResolveOptions = { businessId: "demo", roles: ["receptionist"] as EmployeeRole[] };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of streamBusinessDNA(input, options)) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ stage: "error", label: "Analysis failed", progress: 1, error: String(err) })}\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}
