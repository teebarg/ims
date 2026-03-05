import { z } from "zod";

export const CategorySchema = z.object({
    id: z.number(),
    name: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Category = z.infer<typeof CategorySchema>;

