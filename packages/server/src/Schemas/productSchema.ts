import z from 'zod';

export const productSchema = z.object({
   uuid: z.string().uuid('Invalid product UUID.'),
   name: z.string().trim().min(1, 'Product name is required.'),
   price: z.number().positive('Product price must be greater than 0.'),
   collection: z.string().trim().min(1, 'Product collection is required.'),
   type: z.string().trim().min(1, 'Product type is required.'),
   img: z.string().trim().url('Product image must be a valid URL.'),
});
