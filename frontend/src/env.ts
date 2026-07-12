import { z } from "zod";

/**
 * Validated environment. Fail fast at boot if configuration is missing or wrong,
 * rather than deep in a request. Server-only values must never be exposed to the
 * client (only NEXT_PUBLIC_* are safe in the browser).
 */
const schema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = schema.parse(process.env);
