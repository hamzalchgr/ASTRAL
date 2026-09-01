import z from 'zod';

const emailSchema = z.string().trim().toLowerCase().email('Invalid email.');

export const registerSchema = z.object({
   name: z.string().trim().min(1, 'Name is required.'),
   email: emailSchema,
   password: z
      .string()
      .trim()
      .min(8, 'Password must be at least 8 characters.')
      .max(20, 'Password cannot exceed 20 characters.'),
});

export const loginSchema = z.object({
   email: emailSchema,
   password: z
      .string()
      .trim()
      .min(1, 'Password is required.')
});
