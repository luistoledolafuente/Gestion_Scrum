import { randomUUID } from 'node:crypto';
import { google } from 'googleapis';
import type { CalendarEvent } from '../../generated/prisma/client.js';
import { env } from '../config/env.js';
import { getAuthenticatedOAuth2Client } from '../config/google-oauth.js';
import { HttpError } from '../utils/http-error.js';

const calendarClient = async (userId?: string | null) => google.calendar({ version: 'v3', auth: await getAuthenticatedOAuth2Client(userId) });
const resource = (event: CalendarEvent, clientEmail?: string) => ({
  summary: event.title,
  description: event.description,
  location: event.location || undefined,
  start: { dateTime: event.startDateTime.toISOString(), timeZone: env.googleCalendarTimezone },
  end: { dateTime: event.endDateTime.toISOString(), timeZone: env.googleCalendarTimezone },
  status: event.status === 'CANCELLED' ? 'cancelled' : 'confirmed',
  attendees: event.inviteClient && clientEmail ? [{ email: clientEmail }] : undefined,
});

const meetRequest = () => ({
  conferenceData: {
    createRequest: {
      requestId: randomUUID(),
      conferenceSolutionKey: { type: 'hangoutsMeet' },
    },
  },
});

const meetUrlFrom = (data: { hangoutLink?: string | null; conferenceData?: { entryPoints?: Array<{ entryPointType?: string | null; uri?: string | null }> | null } | null }) =>
  data.hangoutLink || data.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri || null;

const waitForMeetUrl = async (googleEventId: string, initial: Parameters<typeof meetUrlFrom>[0], userId?: string | null) => {
  let url = meetUrlFrom(initial);
  for (let attempt = 0; !url && attempt < 3; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const response = await (await calendarClient(userId)).events.get({ calendarId: 'primary', eventId: googleEventId });
    url = meetUrlFrom(response.data);
  }
  return url;
};

export const googleCalendarService = {
  createGoogleEvent: async (event: CalendarEvent, clientEmail?: string) => {
    const response = await (await calendarClient(event.organizerUserId)).events.insert({
      calendarId: 'primary',
      conferenceDataVersion: event.createGoogleMeet ? 1 : undefined,
      sendUpdates: event.inviteClient && clientEmail ? 'all' : 'none',
      requestBody: { ...resource(event, clientEmail), ...(event.createGoogleMeet ? meetRequest() : {}) },
    });
    if (!response.data.id) throw new HttpError(502, 'Google Calendar no devolvió un identificador para el evento.');
    const googleMeetUrl = event.createGoogleMeet ? await waitForMeetUrl(response.data.id, response.data, event.organizerUserId) : null;
    return { googleEventId: response.data.id, googleMeetUrl };
  },
  updateGoogleEvent: async (event: CalendarEvent, clientEmail?: string) => {
    if (!event.googleEventId) throw new HttpError(400, 'El evento no tiene vínculo con Google Calendar.');
    const shouldCreateMeet = event.createGoogleMeet && !event.googleMeetUrl;
    const response = await (await calendarClient(event.organizerUserId)).events.patch({
      calendarId: 'primary',
      eventId: event.googleEventId,
      conferenceDataVersion: 1,
      sendUpdates: event.inviteClient && clientEmail ? 'all' : 'none',
      requestBody: { ...resource(event, clientEmail), ...(shouldCreateMeet ? meetRequest() : {}) },
    });
    const googleMeetUrl = shouldCreateMeet ? await waitForMeetUrl(event.googleEventId, response.data, event.organizerUserId) : event.googleMeetUrl;
    return { googleMeetUrl };
  },
  deleteGoogleEvent: async (googleEventId: string, userId?: string | null) => {
    await (await calendarClient(userId)).events.delete({ calendarId: 'primary', eventId: googleEventId });
  },
};
