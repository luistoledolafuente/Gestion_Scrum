import type { RequestHandler } from 'express';
import { getClientPortal } from '../services/client-portal.service.js';

export const clientPortal: RequestHandler = async (req, res) => {
  res.json(await getClientPortal(String(req.params.token)));
};
