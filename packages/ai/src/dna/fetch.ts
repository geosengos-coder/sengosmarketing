/**
 * SSRF-safe website fetch + readable-text extraction. This runs server-side and
 * pulls arbitrary visitor-supplied URLs, so it is guardrailed: http(s) only,
 * internal/link-local hosts blocked, request timeout, and a response size cap.
 *
 * Hardening note (tracked in the Risk Register): redirects can still reach an
 * internal host; production should validate every hop's resolved IP or fetch via
 * an egress proxy/allowlist.
 */

const BLOCKED_HOST =
  /^(localhost$|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0$|::1$|metadata\.|.*\.internal$|.*\.local$)/i;

export interface FetchedPage {
  url: string;
  title?: string;
  description?: string;
  text: string;
}

export interface FetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxTextChars?: number;
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function assertPublicHttp(url: string): URL {
  const u = new URL(url);
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error(`Unsupported scheme: ${u.protocol}`);
  }
  if (BLOCKED_HOST.test(u.hostname)) {
    throw new Error(`Blocked host: ${u.hostname}`);
  }
  return u;
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return await res.text();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      chunks.push(value);
      if (total >= maxBytes) {
        await reader.cancel();
        break;
      }
    }
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(concat(chunks));
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

function extract(html: string, maxTextChars: number): Omit<FetchedPage, "url"> {
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  const description = html
    .match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]
    ?.trim();

  const text = decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxTextChars);

  return { title: title || undefined, description: description || undefined, text };
}

export async function fetchWebsite(rawUrl: string, opts: FetchOptions = {}): Promise<FetchedPage> {
  const url = normalizeUrl(rawUrl);
  assertPublicHttp(url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 6000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "SDS-DNA/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html") && !contentType.startsWith("text/")) {
      throw new Error(`Unsupported content-type: ${contentType}`);
    }
    const html = await readCapped(res, opts.maxBytes ?? 600_000);
    return { url, ...extract(html, opts.maxTextChars ?? 8000) };
  } finally {
    clearTimeout(timer);
  }
}
