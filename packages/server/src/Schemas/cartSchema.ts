import z from "zod";

export const addToCartSchema = z.object({
   user_id: z.number().positive(),
   product_uuid: z.string().uuid(),
   quantity: z.number().int().positive().default(1)
})

export const cartItemParamsSchema = z.object({
   user_id: z.coerce.number().int().positive(),
   product_uuid: z.string().uuid().optional(),
});