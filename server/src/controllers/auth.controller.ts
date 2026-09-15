import { randomBytes } from 'node:crypto';
import type { RequestHandler } from 'express';
import { google } from 'googleapis';
import { env } from '../config/env.js';
import { prisma } from '../models/prisma.js';
import { authService, GOOGLE_LOGIN_STATE_COOKIE, SESSION_COOKIE } from '../services/auth.service.js';
import { parseCookies } from '../middleware/auth.middleware.js';
import { HttpError } from '../utils/http-error.js';

const loginClient = () => new google.auth.OAuth2(env.googleClientId, env.googleClientSecret, env.googleLoginRedirectUri);

export const authController = {
  register: (async (req, res) => {
    const user = await authService.register(req.body);
    await authService.createSession(user.id, res);
    res.status(201).json(authService.publicUser(user));
  }) as RequestHandler,

  login: (async (req, res) => {
    const user = await authService.login(req.body);
    await authService.createSession(user.id, res);
    res.json(authService.publicUser(user));
  }) as RequestHandler,

  me: (async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.authUser!.id }, include: { memberships: { include: { workspace: true } } } });
    res.json(authService.publicUser(user));
  }) as RequestHandler,

  logout: (async (req, res) => {
    await authService.clearSession(parseCookies(req.headers.cookie)[SESSION_COOKIE], res);
    res.status(204).send();
  }) as RequestHandler,

  googleStart: ((_req, res) => {
    if (!env.googleClientId || !env.googleClientSecret) throw new HttpError(503, 'El acceso con Google todavía no está configurado.');
    const state = randomBytes(24).toString('base64url');
    res.cookie(GOOGLE_LOGIN_STATE_COOKIE, state, { ...authService.cookieOptions, maxAge: 10 * 60 * 1000 });
    res.redirect(loginClient().generateAuthUrl({ access_type: 'online', prompt: 'select_account', scope: ['openid', 'email', 'profile'], state }));
  }) as RequestHandler,

  googleCallback: (async (req, res) => {
    const stateCookie = parseCookies(req.headers.cookie)[GOOGLE_LOGIN_STATE_COOKIE];
    const state = String(req.query.state || '');
    if (!stateCookie || stateCookie !== state) throw new HttpError(400, 'El estado OAuth no es válido o expiró.');
    const code = String(req.query.code || '');
    if (!code) throw new HttpError(400, 'Google no devolvió un código de autorización.');
    const { tokens } = await loginClient().getToken(code);
    if (!tokens.id_token) throw new HttpError(400, 'Google no devolvió la identidad del usuario.');
    const ticket = await loginClient().verifyIdToken({ idToken: tokens.id_token, audience: env.googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) throw new HttpError(400, 'La cuenta de Google no tiene un correo disponible.');
    if (!payload.email_verified) throw new HttpError(403, 'Google no confirmó este correo electrónico.');
    const user = await authService.findOrCreateGoogleUser({ sub: payload.sub, email: payload.email.toLowerCase(), name: payload.name || payload.email.split('@')[0], picture: payload.picture, emailVerified: Boolean(payload.email_verified) });
    await authService.createSession(user.id, res);
    res.clearCookie(GOOGLE_LOGIN_STATE_COOKIE, authService.cookieOptions);
    res.redirect(`${env.clientOrigin}/?auth=google`);
  }) as RequestHandler,
};
