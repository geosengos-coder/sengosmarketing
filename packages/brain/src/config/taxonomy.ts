import type { NodeFamily } from "../store/types";

/**
 * Family colors — cool, iridescent, luminous-on-ink (SDS identity). Matches the
 * site's cyan/violet aesthetic and the Siri voice orb: systems read as electric
 * blue, knowledge as violet, activity as cyan, the core as a cool luminous white.
 */
export const FAMILY_COLOR: Record<NodeFamily, string> = {
  system: "#5B8CFF", // electric blue
  knowledge: "#A99BFF", // violet
  activity: "#22D3EE", // cyan
  intelligence: "#E8ECFF", // cool luminous core
};

export const FAMILY_RADIUS: Record<NodeFamily, number> = {
  system: 0.17,
  knowledge: 0.15,
  activity: 0.12,
  intelligence: 0.42,
};

/** Deep, warm ink — the stage the brain lives on. */
export const STAGE_BACKGROUND = "#0B0A07";
