import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../models/prisma.js';
import type { JsonObject } from '../utils/payload.js';
import { requireFields, withDates } from '../utils/payload.js';
import { HttpError } from '../utils/http-error.js';
import type { WorkspaceAccess } from '../types/workspace.js';

const projectInclude = {
  client: true,
  sprints: { orderBy: { startDate: 'desc' as const } },
  backlogItems: { orderBy: { createdAt: 'desc' as const } },
  calendarEvents: { orderBy: { startDateTime: 'asc' as const } },
};

export const projectsService = {
  list: (_query: Record<string, unknown>, access: WorkspaceAccess) => prisma.project.findMany({ where: { workspaceId: access.workspaceId }, include: projectInclude, orderBy: { updatedAt: 'desc' } }),
  get: (id: string, access: WorkspaceAccess) => prisma.project.findFirst({ where: { id, workspaceId: access.workspaceId }, include: projectInclude }),
  create: async (body: JsonObject, access: WorkspaceAccess) => {
    requireFields(body, ['name', 'description', 'startDate', 'clientId']);
    const client = await prisma.client.findFirst({ where: { id: String(body.clientId), workspaceId: access.workspaceId } });
    if (!client) throw new HttpError(400, 'El cliente no pertenece a este espacio de trabajo.');
    return prisma.project.create({ data: { ...withDates(body, ['startDate', 'endDate']), workspaceId: access.workspaceId } as Prisma.ProjectUncheckedCreateInput, include: projectInclude });
  },
  update: async (id: string, body: JsonObject, access: WorkspaceAccess) => {
    const project = await prisma.project.findFirst({ where: { id, workspaceId: access.workspaceId } });
    if (!project) throw new HttpError(404, 'Proyecto no encontrado');
    if (body.clientId) {
      const client = await prisma.client.findFirst({ where: { id: String(body.clientId), workspaceId: access.workspaceId } });
      if (!client) throw new HttpError(400, 'El cliente no pertenece a este espacio de trabajo.');
    }
    const { workspaceId: _ignored, ...safeBody } = withDates(body, ['startDate', 'endDate']);
    return prisma.project.update({ where: { id }, data: safeBody as Prisma.ProjectUncheckedUpdateInput, include: projectInclude });
  },
  remove: async (id: string, access: WorkspaceAccess) => {
    const project = await prisma.project.findFirst({ where: { id, workspaceId: access.workspaceId } });
    if (!project) throw new HttpError(404, 'Proyecto no encontrado');
    return prisma.project.delete({ where: { id } });
  },
};
