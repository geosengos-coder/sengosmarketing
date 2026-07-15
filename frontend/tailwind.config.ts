import path from "node:path";
import type { Config } from "tailwindcss";

/**
 * Tokens-first: colors map to CSS variables defined in app/globals.css (and shared
 * via @operatoros/ui). Swapping the variables re-themes the whole app (and enables
 * per-tenant white-labeling later) without touching component classes.
 *
 * Content globs are absolute (resolved to this file's directory) so Tailwind scans
 * the right files regardless of the dev server's working directory — otherwise it
 * finds nothing and purges every utility.
 */
const here = __dirname;

const config: Config = {
  content: [
    path.join(here, "app/**/*.{ts,tsx}"),
    path.join(here, "src/**/*.{ts,tsx}"),
    path.join(here, "../packages/ui/src/**/*.{ts,tsx}"),
    path.join(here, "../packages/brain/src/**/*.{ts,tsx}"),
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        primary: "hsl(var(--primary) / <alpha-value>)",
        "primary-foreground": "hsl(var(--primary-foreground) / <alpha-value>)",
        brass: "hsl(var(--brass) / <alpha-value>)",
        stage: "hsl(var(--stage) / <alpha-value>)",
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.3em",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
