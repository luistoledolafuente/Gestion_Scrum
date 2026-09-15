import type { RequestHandler } from 'express';
import type { JsonObject } from '../utils/payload.js';
import { HttpError } from '../utils/http-error.js';

type CrudService = {
  list: (query: Record<string, unknown>) => Promise<unknown>;
  get: (id: string) => Promise<unknown | null>;
  create: (body: JsonObject) => Promise<unknown>;
  update: (id: string, body: JsonObject) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
};

export const createCrudController = (service: CrudService) => ({
  list: (async (req, res) => res.json(await service.list(req.query))) as RequestHandler,
  get: (async (req, res) => {
    const result = await service.get(String(req.params.id));
    if (!result) throw new HttpError(404, 'Registro no encontrado');
    res.json(result);
  }) as RequestHandler,
  create: (async (req, res) => res.status(201).json(await service.create(req.body))) as RequestHandler,
  update: (async (req, res) => res.json(await service.update(String(req.params.id), req.body))) as RequestHandler,
  remove: (async (req, res) => {
    await service.remove(String(req.params.id));
    res.status(204).send();
  }) as RequestHandler,
});
