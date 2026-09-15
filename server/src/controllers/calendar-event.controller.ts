import type { RequestHandler } from 'express';
import { calendarEventsService } from '../services/calendar-events.service.js';
import { HttpError } from '../utils/http-error.js';

export const calendarEventController = {
  list: (async (req, res) => res.json(await calendarEventsService.list(req.query))) as RequestHandler,
  get: (async (req, res) => {
    const event = await calendarEventsService.get(String(req.params.id));
    if (!event) throw new HttpError(404, 'Reunión no encontrada.');
    res.json(event);
  }) as RequestHandler,
  create: (async (req, res) => res.status(201).json(await calendarEventsService.create(req.body, req.authUser!.id))) as RequestHandler,
  update: (async (req, res) => res.json(await calendarEventsService.update(String(req.params.id), req.body))) as RequestHandler,
  remove: (async (req, res) => res.json(await calendarEventsService.remove(String(req.params.id)))) as RequestHandler,
};
