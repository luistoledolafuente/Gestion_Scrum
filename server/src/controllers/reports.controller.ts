import type { RequestHandler } from 'express';
import { getPortfolioReport } from '../services/reports.service.js';

export const portfolioReport = (async (_req, res) => {
  res.json(await getPortfolioReport());
}) as RequestHandler;
