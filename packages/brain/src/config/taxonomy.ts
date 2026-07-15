import type { NodeFamily } from "../store/types";

/**
 * Family colors — warm, premium, luminous-on-ink (Meridian identity). Not neon.
 * Systems read as brass, knowledge as warm bone, activity as sage, the core as light.
 */
export const FAMILY_COLOR: Record<NodeFamily, string> = {
  system: "#C6A867", // brass
  knowledge: "#E7DEC9", // warm bone
  activity: "#7BA894", // sage green
  intelligence: "#EAF6EE", // luminous core
};

export const FAMILY_RADIUS: Record<NodeFamily, number> = {
  system: 0.17,
  knowledge: 0.15,
  activity: 0.12,
  intelligence: 0.42,
};

/** Deep, warm ink — the stage the brain lives on. */
export const STAGE_BACKGROUND = "#0B0A07";
