import express from 'express';
import type { Request, Response } from 'express';
import { productSchema } from '../Schemas/productSchema';
import { success } from 'zod';
import { pool } from '../Config/db';

const router = express.Router();

// CREATE
router.post('/create', async (req: Request, res: Response) => {
   const validation = productSchema.safeParse(req.body);

   if (!validation.success) {
      return res.status(401).json({
         success: false,
         message: validation.error.flatten().fieldErrors,
      })
   }

   const { uuid, name, price, collection, type, img } = validation.data;

   try {
      const result = await pool.query(
         `INSERT INTO products (uuid, name, price, collection, type, img)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [uuid, name, price, collection, type, img]
      )

      const product = result.rows[0];
      
      res.status(201).json({
         message: 'Product is created successfully.',
         product
      })
   } catch (error: any) {
      if (error?.code === '23505') {
         return res.status(409).json({
            message: 'Product with the same UUID already exists.'
         })
      }

      console.error(error);
      res.status(500).json({ message: 'Internal server error.' })
   }
})

// GET PRODUCTS

// GET SINGLE PRODUCT INFO BY UUID



export default router;