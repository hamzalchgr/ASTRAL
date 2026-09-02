import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { pool } from "../Config/db";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
   const token = req.cookies.token;

   if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
   }

   try {
      const verified = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { id: string };

      const result = await pool.query(
         `SELECT id, name, email FROM users WHERE id = $1`, [verified.id]
      )

      const user = result.rows[0];
      if (!user) {
         return res.status(401).json({ message: 'Could not find user.' })
      }

      req.user = user;
      next();
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Invalid or expired token.' })
   }
}