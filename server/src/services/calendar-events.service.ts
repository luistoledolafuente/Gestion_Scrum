import type { CalendarEvent, Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../models/prisma.js';
import { HttpError } from '../utils/http-error.js';
import type { JsonObject } from '../utils/payload.js';
import { requireFields, withDates } from '../utils/payload.js';
import { googleCalendarService } from './google-calendar.service.js';
import type { WorkspaceAccess } from '../types/workspace.js';

const include = {
  project: { select: { id: true, name: true } },
  client: { select: { id: true, name: true, companyName: true } },
};

const syncMessage = (error: unknown) => error instanceof Error ? `El cambio se guardó internamente, pero no se pudo sincronizar con Google Calendar: ${error.message}` : 'El cambio se guardó internamente, pero Google Calendar no respondió.';

const validateRange = (data: Record<string, unknown>, current?: CalendarEvent) => {
  const start = data.startDateTime instanceof Date ? data.startDateTime : current?.startDateTime;
  const end = data.endDateTime instanceof Date ? data.endDateTime : current?.endDateTime;
  if (start && end && end <= start) throw new HttpError(400, 'La fecha de fin debe ser posterior a la fecha de inicio.');
};

const clientEmailFor = async (event: CalendarEvent) => {
  if (!event.inviteClient || !event.clientId) return undefined;
  return (await prisma.client.findUnique({ where: { id: event.clientId }, select: { email: true } }))?.email;
};

export const calendarEventsService = {
  list: (query: Record<string, unknown>, access: WorkspaceAccess) => {
    const where: Prisma.CalendarEventWhereInput = { project: { workspaceId: access.workspaceId } };
    if (typeof query.projectId === 'string') where.projectId = query.projectId;
    if (typeof query.clientId === 'string') where.clientId = query.clientId;
    const range: Prisma.DateTimeFilter = {};
    if (typeof query.start === 'string') range.gte = new Date(query.start);
    if (typeof query.end === 'string') range.lte = new Date(query.end);
    if (range.gte || range.lte) where.startDateTime = range;
    return prisma.calendarEvent.findMany({ where, include, orderBy: { startDateTime: 'asc' } });
  },
  get: (id: string, access: WorkspaceAccess) => prisma.calendarEvent.findFirst({ where: { id, project: { workspaceId: access.workspaceId } }, include }),
  create: async (body: JsonObject, access: WorkspaceAccess) => {
    requireFields(body, ['projectId', 'title', 'description', 'type', 'startDateTime', 'endDateTime']);
    const project = await prisma.project.findFirst({ where: { id: String(body.projectId), workspaceId: access.workspaceId } });
    if (!project) throw new HttpError(400, 'El proyecto no pertenece a este espacio de trabajo.');
    if (body.clientId) {
      const client = await prisma.client.findFirst({ where: { id: String(body.clientId), workspaceId: access.workspaceId } });
      if (!client) throw new HttpError(400, 'El cliente no pertenece a este espacio de trabajo.');
    }
    const data = { ...withDates(body, ['startDateTime', 'endDateTime']), organizerUserId: access.userId };
    validateRange(data);
    let event = await prisma.calendarEvent.create({ data: data as Prisma.CalendarEventUncheckedCreateInput });
    let syncWarning: string | undefined;
    if (event.syncWithGoogle) {
      try {
        const google = await googleCalendarService.createGoogleEvent(event, await clientEmailFor(event));
        event = await prisma.calendarEvent.update({ where: { id: event.id }, data: google });
      } catch (error) { syncWarning = syncMessage(error); }
    }
    return { ...(await prisma.calendarEvent.findUniqueOrThrow({ where: { id: event.id }, include })), syncWarning };
  },
  update: async (id: string, body: JsonObject, access: WorkspaceAccess) => {
    const current = await prisma.calendarEvent.findFirst({ where: { id, project: { workspaceId: access.workspaceId } } });
    if (!current) throw new HttpError(404, 'Reunión no encontrada.');
    if (body.projectId) {
      const project = await prisma.project.findFirst({ where: { id: String(body.projectId), workspaceId: access.workspaceId } });
      if (!project) throw new HttpError(400, 'El proyecto no pertenece a este espacio de trabajo.');
    }
    if (body.clientId) {
      const client = await prisma.client.findFirst({ where: { id: String(body.clientId), workspaceId: access.workspaceId } });
      if (!client) throw new HttpError(400, 'El cliente no pertenece a este espacio de trabajo.');
    }
    const data = withDates(body, ['startDateTime', 'endDateTime']);
    validateRange(data, current);
    let event = await prisma.calendarEvent.update({ where: { id }, data: data as Prisma.CalendarEventUncheckedUpdateInput });
    let syncWarning: string | undefined;
    if (event.syncWithGoogle) {
      try {
        if (event.googleEventId) {
          const google = await googleCalendarService.updateGoogleEvent(event, await clientEmailFor(event));
          event = await prisma.calendarEvent.update({ where: { id: event.id }, data: google });
        }
        else {
          const google = await googleCalendarService.createGoogleEvent(event, await clientEmailFor(event));
          event = await prisma.calendarEvent.update({ where: { id }, data: google });
        }
      } catch (error) { syncWarning = syncMessage(error); }
    }
    return { ...(await prisma.calendarEvent.findUniqueOrThrow({ where: { id: event.id }, include })), syncWarning };
  },
  remove: async (id: string, access: WorkspaceAccess) => {
    const current = await prisma.calendarEvent.findFirst({ where: { id, project: { workspaceId: access.workspaceId } } });
    if (!current) throw new HttpError(404, 'Reunión no encontrada.');
    let syncWarning: string | undefined;
    if (current.googleEventId) {
      try { await googleCalendarService.deleteGoogleEvent(current.googleEventId, current.organizerUserId); }
      catch (error) { syncWarning = syncMessage(error); }
    }
    const event = await prisma.calendarEvent.update({ where: { id }, data: { status: 'CANCELLED' }, include });
    return { ...event, syncWarning };
  },
};
