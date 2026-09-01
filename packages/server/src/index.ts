import type { Express } from 'express';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const PORT = process.env.PORT || 5000;

const app: Express = express();

app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
   console.log('Running ...')
})