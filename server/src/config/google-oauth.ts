import { google } from 'googleapis';
import { env } from './env.js';
import { HttpError } from '../utils/http-error.js';
import { prisma } from '../models/prisma.js';
import { decryptToken } from '../utils/token-crypto.js';

export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

export const getAuthenticatedOAuth2Client = async (userId?: string | null) => {
  if (userId) {
    const connection = await prisma.googleConnection.findUnique({ where: { userId } });
    if (connection) {
      const client = new google.auth.OAuth2(env.googleClientId, env.googleClientSecret, env.googleCalendarRedirectUri);
      client.setCredentials({
        refresh_token: decryptToken(connection.refreshTokenCipher),
        access_token: connection.accessTokenCipher ? decryptToken(connection.accessTokenCipher) : undefined,
        expiry_date: connection.accessTokenExpiresAt?.getTime(),
      });
      return client;
    }
  }
  if (!env.googleClientId || !env.googleClientSecret || !env.googleRefreshToken) {
    throw new HttpError(503, 'Conecta tu cuenta de Google Calendar desde Configuración.');
  }
  const client = new google.auth.OAuth2(env.googleClientId, env.googleClientSecret, env.googleRedirectUri);
  client.setCredentials({ access_token: env.googleAccessToken || undefined, refresh_token: env.googleRefreshToken });
  return client;
};
