import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../models/prisma.js';
import type { JsonObject } from '../utils/payload.js';
import { HttpError } from '../utils/http-error.js';
import { requireFields } from '../utils/payload.js';
import type { WorkspaceAccess } from '../types/workspace.js';

const include = { backlogItem: true, sprint: true };

export const sprintItemsService = {
  list: (query: Record<string, unknown>, access: WorkspaceAccess) => prisma.sprintItem.findMany({ where: { ...(typeof query.sprintId === 'string' ? { sprintId: query.sprintId } : {}), sprint: { project: { workspaceId: access.workspaceId } } }, include, orderBy: { createdAt: 'asc' } }),
  get: (id: string, access: WorkspaceAccess) => prisma.sprintItem.findFirst({ where: { id, sprint: { project: { workspaceId: access.workspaceId } } }, include }),
  create: async (body: JsonObject, access: WorkspaceAccess) => {
    requireFields(body, ['sprintId', 'backlogItemId']);
    return prisma.$transaction(async (tx) => {
      const [sprint, backlogItem] = await Promise.all([
        tx.sprint.findFirst({ where: { id: String(body.sprintId), project: { workspaceId: access.workspaceId } }, select: { projectId: true } }),
        tx.backlogItem.findFirst({ where: { id: String(body.backlogItemId), project: { workspaceId: access.workspaceId } }, select: { projectId: true } }),
      ]);
      if (!sprint || !backlogItem) throw new HttpError(404, 'Sprint o item de backlog no encontrado');
      if (sprint.projectId !== backlogItem.projectId) throw new HttpError(400, 'El item no pertenece al proyecto del sprint');
      const item = await tx.sprintItem.create({ data: body as Prisma.SprintItemUncheckedCreateInput, include });
      await tx.backlogItem.update({ where: { id: item.backlogItemId }, data: { status: item.state === 'done' ? 'done' : 'in_sprint' } });
      return item;
    });
  },
  update: async (id: string, body: JsonObject, access: WorkspaceAccess) => prisma.$transaction(async (tx) => {
    const current = await tx.sprintItem.findFirst({ where: { id, sprint: { project: { workspaceId: access.workspaceId } } } });
    if (!current) throw new HttpError(404, 'Item de sprint no encontrado');
    const targetSprintId = String(body.sprintId || current.sprintId);
    const targetBacklogItemId = String(body.backlogItemId || current.backlogItemId);
    const [targetSprint, targetBacklogItem] = await Promise.all([
      tx.sprint.findFirst({ where: { id: targetSprintId, project: { workspaceId: access.workspaceId } }, select: { projectId: true } }),
      tx.backlogItem.findFirst({ where: { id: targetBacklogItemId, project: { workspaceId: access.workspaceId } }, select: { projectId: true } }),
    ]);
    if (!targetSprint || !targetBacklogItem || targetSprint.projectId !== targetBacklogItem.projectId) throw new HttpError(400, 'El item y el sprint deben pertenecer al mismo proyecto de este workspace.');
    const data = { ...body } as Prisma.SprintItemUncheckedUpdateInput;
    if (body.state === 'done') data.completedAt = new Date();
    if (body.state && body.state !== 'done') data.completedAt = null;
    const item = await tx.sprintItem.update({ where: { id }, data, include });
    await tx.backlogItem.update({ where: { id: item.backlogItemId }, data: { status: item.state === 'done' ? 'done' : 'in_sprint' } });
    return item;
  }),
  remove: async (id: string, access: WorkspaceAccess) => {
    const item = await prisma.sprintItem.findFirst({ where: { id, sprint: { project: { workspaceId: access.workspaceId } } } });
    if (!item) throw new HttpError(404, 'Item de sprint no encontrado');
    return prisma.sprintItem.delete({ where: { id } });
  },
};
