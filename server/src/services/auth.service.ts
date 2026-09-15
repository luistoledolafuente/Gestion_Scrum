import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { prisma } from '../models/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

export const SESSION_COOKIE = 'momentum_session';
export const GOOGLE_LOGIN_STATE_COOKIE = 'momentum_google_login_state';
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const publicUser = (user: { id: string; email: string; name: string; pictureUrl: string | null; emailVerified: boolean; memberships?: Array<{ role: string; workspace: { id: string; name: string; slug: string } }> }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  pictureUrl: user.pictureUrl,
  emailVerified: user.emailVerified,
  workspaces: user.memberships?.map((membership) => ({ ...membership.workspace, role: membership.role })) || [],
});

const createWorkspace = (name: string, userId: string) => prisma.workspace.create({
  data: {
    name: `${name} Workspace`,
    slug: `${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 35) || 'workspace'}-${randomUUID().slice(0, 8)}`,
    memberships: { create: { userId, role: 'OWNER' } },
  },
});

const getUser = (id: string) => prisma.user.findUniqueOrThrow({
  where: { id },
  include: { memberships: { include: { workspace: true } } },
});

export const authService = {
  register: async (body: Record<string, unknown>) => {
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (name.length < 2) throw new HttpError(400, 'Ingresa un nombre válido.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Ingresa un correo válido.');
    if (password.length < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres.');
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new HttpError(409, 'Ya existe una cuenta con este correo.');
    const user = await prisma.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
    await createWorkspace(name, user.id);
    return getUser(user.id);
  },

  login: async (body: Record<string, unknown>) => {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) throw new HttpError(401, 'Correo o contraseña incorrectos.');
    return getUser(user.id);
  },

  findOrCreateGoogleUser: async (profile: { sub: string; email: string; name: string; picture?: string; emailVerified: boolean }) => {
    let user = await prisma.user.findFirst({ where: { OR: [{ googleSubject: profile.sub }, { email: profile.email }] } });
    if (user) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleSubject: profile.sub, name: profile.name || user.name, pictureUrl: profile.picture || user.pictureUrl, emailVerified: profile.emailVerified || user.emailVerified } });
    } else {
      user = await prisma.user.create({ data: { email: profile.email, name: profile.name, googleSubject: profile.sub, pictureUrl: profile.picture, emailVerified: profile.emailVerified } });
      await createWorkspace(profile.name, user.id);
    }
    return getUser(user.id);
  },

  createSession: async (userId: string, res: Response) => {
    const rawToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + env.sessionDays * 86_400_000);
    await prisma.session.create({ data: { userId, tokenHash: hashToken(rawToken), expiresAt } });
    res.cookie(SESSION_COOKIE, rawToken, { ...cookieOptions, expires: expiresAt });
  },

  clearSession: async (rawToken: string | undefined, res: Response) => {
    if (rawToken) await prisma.session.deleteMany({ where: { tokenHash: hashToken(rawToken) } });
    res.clearCookie(SESSION_COOKIE, cookieOptions);
  },

  publicUser,
  cookieOptions,
};
