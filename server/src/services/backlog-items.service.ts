import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../models/prisma.js';
import type { JsonObject } from '../utils/payload.js';
import { requireFields } from '../utils/payload.js';
import { HttpError } from '../utils/http-error.js';
import type { WorkspaceAccess } from '../types/workspace.js';

export const backlogItemsService = {
  list: (query: Record<string, unknown>, access: WorkspaceAccess) => prisma.backlogItem.findMany({ where: { ...(typeof query.projectId === 'string' ? { projectId: query.projectId } : {}), project: { workspaceId: access.workspaceId } }, include: { sprintItems: true }, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] }),
  get: (id: string, access: WorkspaceAccess) => prisma.backlogItem.findFirst({ where: { id, project: { workspaceId: access.workspaceId } }, include: { project: true, sprintItems: { include: { sprint: true } } } }),
  create: async (body: JsonObject, access: WorkspaceAccess) => {
    requireFields(body, ['projectId', 'title', 'description', 'type']);
    const project = await prisma.project.findFirst({ where: { id: String(body.projectId), workspaceId: access.workspaceId } });
    if (!project) throw new HttpError(400, 'El proyecto no pertenece a este espacio de trabajo.');
    return prisma.backlogItem.create({ data: body as Prisma.BacklogItemUncheckedCreateInput });
  },
  update: async (id: string, body: JsonObject, access: WorkspaceAccess) => {
    const item = await prisma.backlogItem.findFirst({ where: { id, project: { workspaceId: access.workspaceId } } });
    if (!item) throw new HttpError(404, 'Item no encontrado');
    if (body.projectId) {
      const project = await prisma.project.findFirst({ where: { id: String(body.projectId), workspaceId: access.workspaceId } });
      if (!project) throw new HttpError(400, 'El proyecto no pertenece a este espacio de trabajo.');
    }
    return prisma.backlogItem.update({ where: { id }, data: body as Prisma.BacklogItemUncheckedUpdateInput });
  },
  remove: async (id: string, access: WorkspaceAccess) => {
    const item = await prisma.backlogItem.findFirst({ where: { id, project: { workspaceId: access.workspaceId } } });
    if (!item) throw new HttpError(404, 'Item no encontrado');
    return prisma.backlogItem.delete({ where: { id } });
  },
};
