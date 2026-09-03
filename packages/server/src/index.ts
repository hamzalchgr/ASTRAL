import type { Express } from 'express';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
// import jsonParser from 'json-parser';
import authRoutes from './Routes/auth.route.ts'
import productRoutes from './Routes/product.route.ts'
import cartRoutes from './Routes/cart.route.ts'

dotenv.config();

const PORT = process.env.PORT || 5000;

const app: Express = express();

app.use(cors());
app.use(express.json());
// app.user(jsonParser());

app.use('/auth', authRoutes);
app.use('/catalog', productRoutes);
app.use('/cart', cartRoutes);

app.listen(PORT, () => {
   console.log('Running ...')
})