import { useId } from "react";

/**
 * Sengos Digital Systems brand mark. A glassy gradient tile — echoing the voice
 * orb's material language — holding three cascading bars that read as stacked
 * "systems" (and a stylized S). Self-contained SVG; the wordmark uses
 * `currentColor` so the logo adapts to light and dark surfaces.
 */
export function SdsMark({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const rim = `sds-rim-${id}`;
  const bar = `sds-bar-${id}`;
  const sheen = `sds-sheen-${id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={rim} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D8B968" />
          <stop offset="0.5" stopColor="#7BE3B0" />
          <stop offset="1" stopColor="#A99BFF" />
        </linearGradient>
        <linearGradient id={bar} x1="10" y1="14" x2="38" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EAD6A6" />
        </linearGradient>
        <radialGradient id={sheen} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(15 13) rotate(45) scale(26)">
          <stop stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* glass tile */}
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#0E0D0B" />
      <rect x="2" y="2" width="44" height="44" rx="14" fill={`url(#${sheen})`} />
      <rect
        x="2.75"
        y="2.75"
        width="42.5"
        height="42.5"
        rx="13.25"
        stroke={`url(#${rim})`}
        strokeWidth="1.5"
        opacity="0.9"
      />

      {/* cascading system bars */}
      <rect x="18" y="14.5" width="20" height="4.6" rx="2.3" fill={`url(#${bar})`} opacity="0.7" />
      <rect x="14" y="21.7" width="20" height="4.6" rx="2.3" fill={`url(#${bar})`} opacity="0.88" />
      <rect x="10" y="28.9" width="20" height="4.6" rx="2.3" fill={`url(#${bar})`} />
    </svg>
  );
}

/**
 * Full logo lockup: the mark plus the wordmark. Defaults to the compact "SDS"
 * wordmark; pass `showFullName` for the spelled-out "Sengos Digital Systems".
 */
export function SdsLogo({
  showFullName = false,
  size = 28,
  className,
}: {
  showFullName?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <SdsMark size={size} />
      <span className="font-semibold tracking-tight">
        {showFullName ? "Sengos Digital Systems" : "SDS"}
      </span>
    </span>
  );
}
