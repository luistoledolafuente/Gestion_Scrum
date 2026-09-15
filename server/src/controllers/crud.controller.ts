import type { RequestHandler } from 'express';
import type { JsonObject } from '../utils/payload.js';
import { HttpError } from '../utils/http-error.js';
import { workspaceAccess, type WorkspaceAccess } from '../types/workspace.js';

type CrudService = {
  list: (query: Record<string, unknown>, access: WorkspaceAccess) => Promise<unknown>;
  get: (id: string, access: WorkspaceAccess) => Promise<unknown | null>;
  create: (body: JsonObject, access: WorkspaceAccess) => Promise<unknown>;
  update: (id: string, body: JsonObject, access: WorkspaceAccess) => Promise<unknown>;
  remove: (id: string, access: WorkspaceAccess) => Promise<unknown>;
};

export const createCrudController = (service: CrudService) => ({
  list: (async (req, res) => res.json(await service.list(req.query, workspaceAccess(req)))) as RequestHandler,
  get: (async (req, res) => {
    const result = await service.get(String(req.params.id), workspaceAccess(req));
    if (!result) throw new HttpError(404, 'Registro no encontrado');
    res.json(result);
  }) as RequestHandler,
  create: (async (req, res) => res.status(201).json(await service.create(req.body, workspaceAccess(req)))) as RequestHandler,
  update: (async (req, res) => res.json(await service.update(String(req.params.id), req.body, workspaceAccess(req)))) as RequestHandler,
  remove: (async (req, res) => {
    await service.remove(String(req.params.id), workspaceAccess(req));
    res.status(204).send();
  }) as RequestHandler,
});
