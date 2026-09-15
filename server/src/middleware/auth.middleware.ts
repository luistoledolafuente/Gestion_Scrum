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
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { memberships: { orderBy: { createdAt: 'asc' } } } } },
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    next(); return;
  }
  req.authUser = { id: session.user.id, email: session.user.email, name: session.user.name, pictureUrl: session.user.pictureUrl };
  req.authSessionId = session.id;
  const requestedWorkspaceId = typeof req.headers['x-workspace-id'] === 'string' ? req.headers['x-workspace-id'] : undefined;
  const membership = requestedWorkspaceId
    ? session.user.memberships.find((item) => item.workspaceId === requestedWorkspaceId)
    : session.user.memberships[0];
  if (requestedWorkspaceId && !membership) { next(new HttpError(403, 'No tienes acceso a este espacio de trabajo.')); return; }
  req.authWorkspaceId = membership?.workspaceId;
  req.authWorkspaceRole = membership?.role;
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.authUser || !req.authSessionId) { next(new HttpError(401, 'Debes iniciar sesión para continuar.')); return; }
  next();
};

export const requireWorkspace: RequestHandler = (req, _res, next) => {
  if (!req.authWorkspaceId || !req.authWorkspaceRole) { next(new HttpError(403, 'No tienes un espacio de trabajo activo.')); return; }
  next();
};

export const requireWorkspaceEditor: RequestHandler = (req, _res, next) => {
  if (!req.authWorkspaceRole || req.authWorkspaceRole === 'CLIENT') {
    next(new HttpError(403, 'Tu rol es de solo lectura en este espacio de trabajo.'));
    return;
  }
  next();
};
