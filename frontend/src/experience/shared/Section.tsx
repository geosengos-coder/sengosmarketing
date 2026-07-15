import type { ReactNode } from "react";

/** A full-width editorial section with generous rhythm. Tone selects the palette. */
export function Section({
  children,
  tone = "paper",
  className = "",
}: {
  children: ReactNode;
  tone?: "paper" | "stage";
  className?: string;
}) {
  const toneClass = tone === "stage" ? "bg-stage text-background" : "bg-background text-foreground";
  return <section className={`w-full ${toneClass} ${className}`}>{children}</section>;
}
