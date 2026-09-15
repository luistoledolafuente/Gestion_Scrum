import { randomBytes } from 'node:crypto';
import type { RequestHandler } from 'express';
import { google } from 'googleapis';
import { env } from '../config/env.js';
import { prisma } from '../models/prisma.js';
import { decryptToken, encryptToken } from '../utils/token-crypto.js';
import { hashToken } from '../services/auth.service.js';
import { HttpError } from '../utils/http-error.js';

export const GOOGLE_CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const integrationClient = () => new google.auth.OAuth2(env.googleClientId, env.googleClientSecret, env.googleCalendarRedirectUri);

export const googleIntegrationController = {
  status: (async (req, res) => {
    const connection = await prisma.googleConnection.findUnique({ where: { userId: req.authUser!.id } });
    res.json({ connected: Boolean(connection), email: connection?.googleAccountEmail || null, scopes: connection?.scopes.split(' ').filter(Boolean) || [], connectedAt: connection?.createdAt || null });
  }) as RequestHandler,

  connect: (async (req, res) => {
    if (!env.googleClientId || !env.googleClientSecret) throw new HttpError(503, 'Google OAuth todavía no está configurado en el servidor.');
    const state = randomBytes(24).toString('base64url');
    await prisma.session.update({ where: { id: req.authSessionId! }, data: { oauthStateHash: hashToken(state), oauthStateExpiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
    const url = integrationClient().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: [GOOGLE_CALENDAR_EVENTS_SCOPE],
      state,
    });
    res.json({ url });
  }) as RequestHandler,

  callback: (async (req, res) => {
    const state = String(req.query.state || '');
    const code = String(req.query.code || '');
    const session = await prisma.session.findUnique({ where: { id: req.authSessionId! } });
    if (!state || !session?.oauthStateHash || session.oauthStateHash !== hashToken(state) || !session.oauthStateExpiresAt || session.oauthStateExpiresAt <= new Date()) throw new HttpError(400, 'La autorización de Google expiró o no es válida.');
    if (!code) throw new HttpError(400, 'Google no devolvió un código de autorización.');
    const existing = await prisma.googleConnection.findUnique({ where: { userId: req.authUser!.id } });
    const { tokens } = await integrationClient().getToken(code);
    const refreshToken = tokens.refresh_token || (existing ? decryptToken(existing.refreshTokenCipher) : null);
    if (!refreshToken) throw new HttpError(400, 'Google no devolvió un refresh token. Desconecta la aplicación desde tu cuenta de Google e inténtalo nuevamente.');
    await prisma.googleConnection.upsert({
      where: { userId: req.authUser!.id },
      create: {
        userId: req.authUser!.id,
        googleAccountEmail: req.authUser!.email,
        refreshTokenCipher: encryptToken(refreshToken),
        accessTokenCipher: tokens.access_token ? encryptToken(tokens.access_token) : null,
        accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scopes: tokens.scope || GOOGLE_CALENDAR_EVENTS_SCOPE,
      },
      update: {
        googleAccountEmail: req.authUser!.email,
        refreshTokenCipher: encryptToken(refreshToken),
        accessTokenCipher: tokens.access_token ? encryptToken(tokens.access_token) : existing?.accessTokenCipher,
        accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : existing?.accessTokenExpiresAt,
        scopes: tokens.scope || existing?.scopes || GOOGLE_CALENDAR_EVENTS_SCOPE,
      },
    });
    await prisma.session.update({ where: { id: session.id }, data: { oauthStateHash: null, oauthStateExpiresAt: null } });
    res.redirect(`${env.clientOrigin}/settings?calendar=connected`);
  }) as RequestHandler,

  disconnect: (async (req, res) => {
    const connection = await prisma.googleConnection.findUnique({ where: { userId: req.authUser!.id } });
    if (connection) {
      try { await integrationClient().revokeToken(decryptToken(connection.refreshTokenCipher)); } catch { /* La eliminación local sigue siendo prioritaria. */ }
      await prisma.googleConnection.delete({ where: { id: connection.id } });
    }
    res.status(204).send();
  }) as RequestHandler,
};
