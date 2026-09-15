import type { RequestHandler } from 'express';
import { prisma } from '../models/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { hashToken, SESSION_COOKIE } from '../services/auth.service.js';

export const parseCookies = (header?: string) => Object.fromEntries((header || '').split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
  const index = part.indexOf('=');
  return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
}));

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) { next(); return; }
  const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    next(); return;
  }
  req.authUser = { id: session.user.id, email: session.user.email, name: session.user.name, pictureUrl: session.user.pictureUrl };
  req.authSessionId = session.id;
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.authUser || !req.authSessionId) { next(new HttpError(401, 'Debes iniciar sesión para continuar.')); return; }
  next();
};
