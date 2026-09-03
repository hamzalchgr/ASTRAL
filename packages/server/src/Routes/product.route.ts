import express from 'express';
import type { Request, Response } from 'express';
import { productQueriesSchema, productSchema } from '../Schemas/productSchema';
import { pool } from '../Config/db';
import { success } from 'zod';

const router = express.Router();

// CREATE
router.post('/create', async (req: Request, res: Response) => {
   const validation = productSchema.safeParse(req.body);

   if (!validation.success) {
      return res.status(400).json({
         success: false,
         message: validation.error.flatten().fieldErrors,
      });
   }

   const { uuid, name, price, collection, type, img } = validation.data;

   try {
      const result = await pool.query(
         `INSERT INTO products (uuid, name, price, collection, type, img)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
         [uuid, name, price, collection, type, img]
      );

      const product = result.rows[0];

      res.status(201).json({
         message: 'Product is created successfully.',
         product,
      });
   } catch (error: any) {
      if (error?.code === '23505') {
         return res.status(409).json({
            message: 'Product with the same UUID already exists.',
         });
      }

      console.error(error);
      res.status(500).json({ message: 'Internal server error.' });
   }
});

// GET PRODUCTS
router.get('/', async (req: Request, res: Response) => {
   const validation = productQueriesSchema.safeParse(req.query);

   if (!validation.success) {
      return res.status(400).json({
         success: false,
         message: validation.error.flatten().fieldErrors,
      })
   }

   const { collection, product_type, search_query } = validation.data;

   try {
      const conditions: string[] = [];
      const queries: any[] = [];

      if (collection) {
         queries.push(collection);
         conditions.push(`collection = $${queries.length}`);
      }

      if (product_type) {
         queries.push(product_type);
         conditions.push(`type = $${queries.length}`);
      }

      if (search_query) {
         queries.push(`%${search_query}%`);
         conditions.push(`name ILIKE $${queries.length}`);
      }

      const whereClause = conditions.length
         ? `WHERE ${conditions.join(' AND ')}`
         : '';

      const result = await pool.query(
         `SELECT uuid, name, price, collection, type, img FROM products ${whereClause}`,
         queries
      );

      res.status(200).json({
         data: result.rows
      })
   } catch (error) {
      console.error(error);
      res.status(500).json({
         message: 'Internal server error. Could not get data.'
      })
   }
});

// GET SINGLE PRODUCT INFO BY UUID

export default router;
