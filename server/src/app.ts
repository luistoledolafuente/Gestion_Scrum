import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import apiRoutes from './routes/index.js';
import { optionalAuth } from './middleware/auth.middleware.js';

export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(optionalAuth);
app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);
