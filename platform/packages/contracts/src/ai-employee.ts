import { z } from "zod";

export const createAIEmployeeSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["RECEPTIONIST"]).default("RECEPTIONIST"),
  greeting: z.string().max(500).optional(),
  instructions: z.string().max(5000).optional(),
});
export type CreateAIEmployeeInput = z.infer<typeof createAIEmployeeSchema>;
