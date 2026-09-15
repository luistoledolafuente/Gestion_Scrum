import 'dotenv/config';

const port = Number(process.env.PORT ?? 4000);

export const env = {
  port,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? '',
  googleLoginRedirectUri: process.env.GOOGLE_LOGIN_REDIRECT_URI ?? `http://localhost:${port}/api/auth/google/callback`,
  googleCalendarRedirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI ?? `http://localhost:${port}/api/integrations/google/callback`,
  googleAccessToken: process.env.GOOGLE_ACCESS_TOKEN ?? '',
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN ?? '',
  googleCalendarTimezone: process.env.GOOGLE_CALENDAR_TIMEZONE ?? 'America/Lima',
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY ?? '',
  sessionDays: Number(process.env.SESSION_DAYS ?? 30),
};

if (!env.databaseUrl) throw new Error('DATABASE_URL no está configurada');
