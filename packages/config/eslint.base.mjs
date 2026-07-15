import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

/** Shared flat ESLint config for the OperatorOS monorepo. */
export default tseslint.config(
  { ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**", "**/*.generated.*"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // "recommended-latest" (not "recommended"/"recommended-legacy") is the flat-config
  // shaped preset: it embeds the plugin instance under `plugins`, which flat config
  // requires. This registers react-hooks/rules-of-hooks and react-hooks/exhaustive-deps
  // so both the rules themselves and any `eslint-disable` comment referencing them resolve.
  reactHooks.configs["recommended-latest"],
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
);
