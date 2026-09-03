import express from 'express';
import type { Request, Response } from 'express';
import { addToCartSchema } from '../Schemas/cartSchema';
import { success } from 'zod';
import { pool } from '../Config/db';

const router = express.Router();

// ADD TO CART
router.post('/add', async (req: Request, res: Response) => {
   const validation = addToCartSchema.safeParse(req.body);

   if (!validation.success) {
      return res.status(400).json({
         success: false,
         message: validation.error.flatten().fieldErrors,
      });
   }

   const { user_id, product_uuid, quantity } = validation.data;

   try {
      const product = await pool.query(
         `
         SELECT uuid FROM products WHERE uuid = $1`,
         [product_uuid]
      );

      if (product.rowCount === 0) {
         return res
            .status(404)
            .json({ success: false, message: 'Product not found.' });
      }

      const result = await pool.query(
         `INSERT INTO cart_items (
            user_id, product_uuid, quantity
         ) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (user_id, product_uuid) 
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity RETURNING *`,
         [user_id, product_uuid, quantity]
      );

      res.status(200).json({
         success: true,
         message: 'Item added to cart.',
         item: result.rows[0],
      });
   } catch (error) {
      console.error(error);
      res.status(500).json({
         success: false,
         message: 'Internal server error.',
      });
   }
});

// REMOVE FROM CART
// CLEAR CART
// GET CART

export default router;
