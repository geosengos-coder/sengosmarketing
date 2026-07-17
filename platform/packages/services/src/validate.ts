import { ValidationError } from "@operatoros/core";
import type { z } from "zod";

/**
 * Parses input against a schema, converting a Zod failure into a domain
 * {@link ValidationError} (HTTP 400) so services never leak Zod internals and the
 * edge maps every failure uniformly.
 */
export function validate<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError("Validation failed", result.error.flatten());
  }
  return result.data;
}
