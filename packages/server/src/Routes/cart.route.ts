import express from 'express';
import type { Request, Response } from 'express';
import { addToCartSchema, cartItemParamsSchema } from '../Schemas/cartSchema';
import { success } from 'zod';
import { pool } from '../Config/db';
import { Result } from 'pg';

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
router.delete('/:user_id/:product_uuid', async (req: Request, res: Response) => {
   const validation = cartItemParamsSchema.safeParse(req.params);

   if (!validation.success) {
      return res.status(400).json({
         success: false,
         message: validation.error.flatten().fieldErrors,
      });
   }

   const { user_id, product_uuid } = validation.data;

   try {
      const result = await pool.query(
         `DELETE FROM cart_items WHERE user_id = $1 AND product_uuid = $2 RETURNING *`,
         [user_id, product_uuid]
      );

      if (result.rowCount === 0) {
         return res.status(404).json({
            success: false,
            message: 'Item not in cart.',
         });
      }

      res.status(200).json({
         success: true,
         message: 'Item removed from cart.',
      });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error.' });
   }
});

// CLEAR CART
// GET CART

export default router;
