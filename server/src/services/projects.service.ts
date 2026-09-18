import { randomUUID } from 'node:crypto';
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

type Deliverable = { id: string; title: string; completed: boolean; completedAt: string | null };

const normalizeDeliverables = (value: unknown): Deliverable[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string') {
      const title = item.trim();
      return title ? [{ id: randomUUID(), title, completed: false, completedAt: null }] : [];
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const candidate = item as Record<string, unknown>;
    const title = String(candidate.title || '').trim();
    if (!title) return [];
    const completed = candidate.completed === true;
    return [{
      id: String(candidate.id || randomUUID()),
      title,
      completed,
      completedAt: completed ? String(candidate.completedAt || new Date().toISOString()) : null,
    }];
  }).slice(0, 100);
};

export const projectsService = {
  list: (_query: Record<string, unknown>, access: WorkspaceAccess) => prisma.project.findMany({ where: { workspaceId: access.workspaceId }, include: projectInclude, orderBy: { updatedAt: 'desc' } }),
  get: (id: string, access: WorkspaceAccess) => prisma.project.findFirst({ where: { id, workspaceId: access.workspaceId }, include: projectInclude }),
  create: async (body: JsonObject, access: WorkspaceAccess) => {
    requireFields(body, ['name', 'description', 'startDate', 'clientId']);
    const client = await prisma.client.findFirst({ where: { id: String(body.clientId), workspaceId: access.workspaceId } });
    if (!client) throw new HttpError(400, 'El cliente no pertenece a este espacio de trabajo.');
    const payload = withDates(body, ['startDate', 'endDate']);
    payload.deliverables = normalizeDeliverables(body.deliverables);
    return prisma.project.create({ data: { ...payload, workspaceId: access.workspaceId } as Prisma.ProjectUncheckedCreateInput, include: projectInclude });
  },
  update: async (id: string, body: JsonObject, access: WorkspaceAccess) => {
    const project = await prisma.project.findFirst({ where: { id, workspaceId: access.workspaceId } });
    if (!project) throw new HttpError(404, 'Proyecto no encontrado');
    if (body.clientId) {
      const client = await prisma.client.findFirst({ where: { id: String(body.clientId), workspaceId: access.workspaceId } });
      if (!client) throw new HttpError(400, 'El cliente no pertenece a este espacio de trabajo.');
    }
    const { workspaceId: _ignored, ...safeBody } = withDates(body, ['startDate', 'endDate']);
    if ('deliverables' in body) safeBody.deliverables = normalizeDeliverables(body.deliverables);
    return prisma.project.update({ where: { id }, data: safeBody as Prisma.ProjectUncheckedUpdateInput, include: projectInclude });
  },
  remove: async (id: string, access: WorkspaceAccess) => {
    const project = await prisma.project.findFirst({ where: { id, workspaceId: access.workspaceId } });
    if (!project) throw new HttpError(404, 'Proyecto no encontrado');
    return prisma.project.delete({ where: { id } });
  },
};
