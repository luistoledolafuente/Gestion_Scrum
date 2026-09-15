import type { RequestHandler } from 'express';
import { getPortfolioReport } from '../services/reports.service.js';
import { workspaceAccess } from '../types/workspace.js';

export const portfolioReport = (async (req, res) => {
  res.json(await getPortfolioReport(workspaceAccess(req)));
}) as RequestHandler;
