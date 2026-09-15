import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../models/prisma.js';
import type { JsonObject } from '../utils/payload.js';
import { requireFields, withDates } from '../utils/payload.js';
import { HttpError } from '../utils/http-error.js';
import type { WorkspaceAccess } from '../types/workspace.js';

const include = { project: true, items: { include: { backlogItem: true }, orderBy: { createdAt: 'asc' as const } }, retrospective: true };

export const sprintsService = {
  list: (query: Record<string, unknown>, access: WorkspaceAccess) => prisma.sprint.findMany({ where: { ...(typeof query.projectId === 'string' ? { projectId: query.projectId } : {}), project: { workspaceId: access.workspaceId } }, include, orderBy: { startDate: 'desc' } }),
  get: (id: string, access: WorkspaceAccess) => prisma.sprint.findFirst({ where: { id, project: { workspaceId: access.workspaceId } }, include }),
  create: async (body: JsonObject, access: WorkspaceAccess) => {
    requireFields(body, ['projectId', 'name', 'goal', 'startDate', 'endDate']);
    const project = await prisma.project.findFirst({ where: { id: String(body.projectId), workspaceId: access.workspaceId } });
    if (!project) throw new HttpError(400, 'El proyecto no pertenece a este espacio de trabajo.');
    return prisma.sprint.create({ data: withDates(body, ['startDate', 'endDate']) as Prisma.SprintUncheckedCreateInput, include });
  },
  update: async (id: string, body: JsonObject, access: WorkspaceAccess) => {
    const sprint = await prisma.sprint.findFirst({ where: { id, project: { workspaceId: access.workspaceId } } });
    if (!sprint) throw new HttpError(404, 'Sprint no encontrado');
    if (body.projectId) {
      const project = await prisma.project.findFirst({ where: { id: String(body.projectId), workspaceId: access.workspaceId } });
      if (!project) throw new HttpError(400, 'El proyecto no pertenece a este espacio de trabajo.');
    }
    return prisma.sprint.update({ where: { id }, data: withDates(body, ['startDate', 'endDate']) as Prisma.SprintUncheckedUpdateInput, include });
  },
  remove: async (id: string, access: WorkspaceAccess) => {
    const sprint = await prisma.sprint.findFirst({ where: { id, project: { workspaceId: access.workspaceId } } });
    if (!sprint) throw new HttpError(404, 'Sprint no encontrado');
    return prisma.sprint.delete({ where: { id } });
  },
};
