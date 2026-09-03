import z from "zod";

export const addToCartSchema = z.object({
   user_id: z.number().positive(),
   product_uuid: z.string().uuid(),
   quantity: z.number().int().positive().default(1)
})