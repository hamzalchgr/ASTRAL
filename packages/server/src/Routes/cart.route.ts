import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import {
   addToCartSchema,
   cartItemParamsSchema,
   updateCartItemSchema,
} from '../Schemas/cartSchema';
import { pool } from '../Config/db';

const router = express.Router();

router.use((req: Request, res: Response, next: NextFunction) => {
   if (!req.user?.id) {
      return res
         .status(401)
         .json({ success: false, message: 'Login required.' });
   }
   next();
});

// ADD TO CART
router.post('/add', async (req: Request, res: Response) => {
   const validation = addToCartSchema.safeParse(req.body);

   if (!validation.success) {
      return res.status(400).json({
         success: false,
         message: validation.error.flatten().fieldErrors,
      });
   }

   const { product_uuid, quantity } = validation.data;
   const user_id = req.user!.id;

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
router.delete('/:product_uuid', async (req: Request, res: Response) => {
   const validation = cartItemParamsSchema.safeParse(req.params);

   if (!validation.success) {
      return res.status(400).json({
         success: false,
         message: validation.error.flatten().fieldErrors,
      });
   }

   const { product_uuid } = validation.data;
   const user_id = req.user!.id;

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
router.patch('/', async (req: Request, res: Response) => {
   const user_id = req.user!.id;

   try {
      await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [user_id]);

      res.status(200).json({
         success: true,
         message: 'Cart cleared.',
      });
   } catch (error) {
      console.error(error);
      res.status(500).json({
         success: false,
         message: 'Internal server error.',
      });
   }
});

// GET CART
router.get('/', async (req: Request, res: Response) => {
   const user_id = req.user!.id;

   try {
      const result = await pool.query(
         `SELECT p.uuid, p.name, p.price, p.collection, p.type, p.img, ci.quantity FROM cart_items ci JOIN products p ON p.uuid = ci.product_uuid WHERE ci.user_id = $1`,
         [user_id]
      );

      const total = result.rows.reduce(
         (sum, item) => sum + item.price * item.quantity
      );

      res.status(200).json({ success: true, data: result.rows, total });
   } catch (error) {
      console.error(error);
      res.status(500).json({
         success: false,
         message: 'Internal server error.',
      });
   }
});

// UPDATE CART
router.patch('/', async (req: Request, res: Response) => {
   const validation = updateCartItemSchema.safeParse(req.body);

   if (!validation.success) {
      return res
         .status(400)
         .json({ message: validation.error.flatten().fieldErrors });
   }

   const { product_uuid, quantity } = validation.data;
   const user_id = req.user!.id;

   try {
      if (quantity === 0) {
         await pool.query(
            `DELETE FROM cart_items WHERE user_id = $1 AND product_uuid = $2 RETURNING *`,
            [user_id, product_uuid]
         );

         return res
            .status(200)
            .json({ success: true, message: 'Item removed from cart.' });
      }

      const result = await pool.query(
         `UPDATE cart_items SET quantity = $2 WHERE user_id = $3 AND product_uuid = $1`,
         [product_uuid, quantity, user_id]
      );

      if (result.rowCount === 0) {
         return res
            .status(404)
            .json({ success: false, message: 'Item not in cart.' });
      }

      res.status(200).json({ success: true, item: result.rows[0] });
   } catch (error) {
      console.error(error);
      res.status(500).json({
         success: false,
         message: 'Internal server error.',
      });
   }
});

export default router;
