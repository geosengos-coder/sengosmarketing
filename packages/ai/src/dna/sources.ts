import type { BusinessInput } from "@operatoros/dna";
import { fetchWebsite } from "./fetch";

/**
 * Collectors normalize every input source into a common evidence shape the
 * analyzer can reason over. Adding a new source (a document store, a reviews API,
 * a CRM export, a future integration) means adding a collector — not changing the
 * analyzer or the DNA contract.
 */
export interface CollectedSource {
  kind: string;
  label?: string;
  text: string;
}

const MAX_SOURCE_CHARS = 8000;

export interface CollectResult {
  sources: CollectedSource[];
  /** True if the website was requested and successfully fetched. */
  websiteFetched: boolean;
}

export async function collectSources(input: BusinessInput): Promise<CollectResult> {
  const sources: CollectedSource[] = [];

  sources.push({
    kind: "metadata",
    label: "Business",
    text: [
      `Name: ${input.businessName}`,
      input.industry ? `Industry: ${input.industry}` : "",
      input.city ? `City: ${input.city}` : "",
      input.websiteUrl ? `Website: ${input.websiteUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  let websiteFetched = false;
  if (input.websiteUrl) {
    try {
      const page = await fetchWebsite(input.websiteUrl);
      sources.push({
        kind: "website",
        label: page.title ?? input.websiteUrl,
        text: [page.title, page.description, page.text].filter(Boolean).join("\n"),
      });
      websiteFetched = true;
    } catch {
      // Unreachable/blocked site — the analyzer still works from other evidence.
    }
  }

  for (const s of input.sources ?? []) {
    sources.push({ kind: s.kind, label: s.label, text: s.text.slice(0, MAX_SOURCE_CHARS) });
  }

  return { sources, websiteFetched };
}
