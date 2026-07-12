import { z } from "zod";

export const updateBusinessProfileSchema = z.object({
  legalName: z.string().min(1).max(200).optional(),
  industry: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional(),
  hours: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateBusinessProfileInput = z.infer<typeof updateBusinessProfileSchema>;
