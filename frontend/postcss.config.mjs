import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the Tailwind config next to this file so it works regardless of the
// process cwd (the dev server may be launched from the repo root).
const dir = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: { config: path.join(dir, "tailwind.config.ts") },
    autoprefixer: {},
  },
};
