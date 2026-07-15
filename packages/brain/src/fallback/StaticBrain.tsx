import { FAMILY_COLOR, FAMILY_RADIUS, STAGE_BACKGROUND } from "../config/taxonomy";
import type { BrainConfig } from "../store/types";

/**
 * The accessible base the WebGL scene enhances: a crafted SVG of the same graph.
 * Rendered when WebGL is unavailable, when the user prefers reduced motion, and on
 * the server (safe first paint). Fully described for assistive tech.
 */
export function StaticBrain({ config }: { config: BrainConfig }) {
  const scale = 26;
  const cx = 200;
  const cy = 200;
  const project = (p: [number, number, number]): [number, number] => [cx + p[0] * scale, cy - p[1] * scale];
  const byId = new Map(config.nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label="The Business Brain: a network connecting a business's website, calendar, CRM, phone, knowledge, and activity to a central AI intelligence."
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="400" height="400" fill={STAGE_BACKGROUND} />
      {config.edges.map((e) => {
        const a = byId.get(e.source);
        const b = byId.get(e.target);
        if (!a || !b) return null;
        const [ax, ay] = project(a.position);
        const [bx, by] = project(b.position);
        return <line key={e.id} x1={ax} y1={ay} x2={bx} y2={by} stroke="#C6A867" strokeOpacity={0.22} />;
      })}
      {config.nodes.map((n) => {
        const [x, y] = project(n.position);
        return <circle key={n.id} cx={x} cy={y} r={FAMILY_RADIUS[n.family] * 26} fill={FAMILY_COLOR[n.family]} />;
      })}
    </svg>
  );
}
