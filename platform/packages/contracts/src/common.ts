import { z } from "zod";

/** A cuid identifier as produced by Prisma's `@default(cuid())`. */
export const idSchema = z.string().min(1);

export const paginationSchema = z.object({
  take: z.number().int().min(1).max(100).default(20),
  skip: z.number().int().min(0).default(0),
});
export type Pagination = z.infer<typeof paginationSchema>;
