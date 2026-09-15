import type { RequestHandler } from 'express';
import { getSprintMetrics } from '../services/metrics.service.js';
import { workspaceAccess } from '../types/workspace.js';

export const sprintMetrics: RequestHandler = async (req, res) => {
  res.json(await getSprintMetrics(String(req.params.id), workspaceAccess(req)));
};
