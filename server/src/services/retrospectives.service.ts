import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../models/prisma.js';
import type { JsonObject } from '../utils/payload.js';
import { requireFields } from '../utils/payload.js';
import { HttpError } from '../utils/http-error.js';
import type { WorkspaceAccess } from '../types/workspace.js';

export const retrospectivesService = {
  list: (query: Record<string, unknown>, access: WorkspaceAccess) => prisma.retrospective.findMany({ where: { ...(typeof query.sprintId === 'string' ? { sprintId: query.sprintId } : {}), sprint: { project: { workspaceId: access.workspaceId } } }, include: { sprint: true }, orderBy: { createdAt: 'desc' } }),
  get: (id: string, access: WorkspaceAccess) => prisma.retrospective.findFirst({ where: { id, sprint: { project: { workspaceId: access.workspaceId } } }, include: { sprint: true } }),
  create: async (body: JsonObject, access: WorkspaceAccess) => {
    requireFields(body, ['sprintId', 'whatWentWell', 'whatDidNotGoWell', 'actions']);
    const sprint = await prisma.sprint.findFirst({ where: { id: String(body.sprintId), project: { workspaceId: access.workspaceId } } });
    if (!sprint) throw new HttpError(400, 'El sprint no pertenece a este espacio de trabajo.');
    return prisma.retrospective.create({ data: body as Prisma.RetrospectiveUncheckedCreateInput });
  },
  update: async (id: string, body: JsonObject, access: WorkspaceAccess) => {
    const item = await prisma.retrospective.findFirst({ where: { id, sprint: { project: { workspaceId: access.workspaceId } } } });
    if (!item) throw new HttpError(404, 'Retrospectiva no encontrada');
    if (body.sprintId) {
      const sprint = await prisma.sprint.findFirst({ where: { id: String(body.sprintId), project: { workspaceId: access.workspaceId } } });
      if (!sprint) throw new HttpError(400, 'El sprint no pertenece a este espacio de trabajo.');
    }
    return prisma.retrospective.update({ where: { id }, data: body as Prisma.RetrospectiveUncheckedUpdateInput });
  },
  remove: async (id: string, access: WorkspaceAccess) => {
    const item = await prisma.retrospective.findFirst({ where: { id, sprint: { project: { workspaceId: access.workspaceId } } } });
    if (!item) throw new HttpError(404, 'Retrospectiva no encontrada');
    return prisma.retrospective.delete({ where: { id } });
  },
};
