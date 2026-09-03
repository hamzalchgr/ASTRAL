import z from "zod";

export const addToCartSchema = z.object({
   product_uuid: z.string().uuid(),
   quantity: z.number().int().positive().default(1)
})

export const updateCartItemSchema = z.object({
   product_uuid: z.string().uuid(),
   quantity: z.number().int().min(0),
})

export const cartItemParamsSchema = z.object({
   product_uuid: z.string().uuid().optional(),
});