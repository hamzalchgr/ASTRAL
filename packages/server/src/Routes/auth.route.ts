import express from 'express';
import type { CookieOptions, Request, Response } from 'express';
import { loginSchema, registerSchema } from '../Schemas/userSchema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../Config/db';
import { memoizer } from 'zod/v4/core';

const router = express.Router();

const cookiesOptions: CookieOptions = {
   httpOnly: true,
   sameSite: 'strict',
   secure: process.env.NODE_ENV === 'production',
   maxAge: 7 * 24 * 60 * 60 * 1000, // 7Ds
};

const genToken = (id: string) => {
   return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

// RGISTER
router.post('/register', async (req: Request, res: Response) => {
   const validation = registerSchema.safeParse(req.body);

   if (!validation.success) {
      return res.status(400).json({
         message: validation.error.flatten().formErrors,
      });
   }

   const { name, email, password } = validation.data;

   try {
      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await pool.query(
         'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING name, email',
         [name, email, passwordHash]
      );

      const user = newUser.rows[0];

      const token = genToken(user.id);
      res.cookie('token', token, cookiesOptions);

      return res
         .status(201)
         .json({ message: 'User registered successfully', user });
   } catch (error: any) {
      if (error?.code === '23505') {
         return res.status(409).json({
            error: 'conflict',
            message: 'A user with this email already exists.',
         });
      }

      console.error(error);
      res.status(500).json({
         message: 'Internal server error.',
      });
   }
});

// LOGIN
router.post('/login', async (req: Request, res: Response) => {
   const validation = loginSchema.safeParse(req.body);

   if (!validation.success) {
      return res.status(400).json({
         message: validation.error.flatten().fieldErrors,
      });
   }

   const { email, password } = validation.data;

   try {
      const result = await pool.query(
         `
            SELECT id, name, email, password FROM users WHERE email = $1
         `,
         [email]
      );

      const user = result.rows[0];

      if (!user) {
         return res.status(400).json({
            message: 'Invalid email or password.',
         });
      }

      const compare = await bcrypt.compare(password, user.password);

      if (!compare) {
         return res.status(400).json({
            message: 'Invalid email or password.',
         });
      }

      const token = genToken(user.id);
      res.cookie('token', token, cookiesOptions);

      return res.status(200).json({message: 'Logged in successfully',
         id: user.id, name: user.name, email: user.email
      })

   } catch (error) {
      console.error('Unexpected login error: ' + error);
      res.status(500).json({
         message: "Something went wrong ..."
      })
   }
});

export default router;
