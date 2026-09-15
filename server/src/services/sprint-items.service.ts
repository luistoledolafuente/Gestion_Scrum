import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../models/prisma.js';
import type { JsonObject } from '../utils/payload.js';
import { HttpError } from '../utils/http-error.js';
import { requireFields } from '../utils/payload.js';

const include = { backlogItem: true, sprint: true };

export const sprintItemsService = {
  list: (query: Record<string, unknown>) => prisma.sprintItem.findMany({ where: typeof query.sprintId === 'string' ? { sprintId: query.sprintId } : {}, include, orderBy: { createdAt: 'asc' } }),
  get: (id: string) => prisma.sprintItem.findUnique({ where: { id }, include }),
  create: async (body: JsonObject) => {
    requireFields(body, ['sprintId', 'backlogItemId']);
    return prisma.$transaction(async (tx) => {
      const [sprint, backlogItem] = await Promise.all([
        tx.sprint.findUnique({ where: { id: String(body.sprintId) }, select: { projectId: true } }),
        tx.backlogItem.findUnique({ where: { id: String(body.backlogItemId) }, select: { projectId: true } }),
      ]);
      if (!sprint || !backlogItem) throw new HttpError(404, 'Sprint o item de backlog no encontrado');
      if (sprint.projectId !== backlogItem.projectId) throw new HttpError(400, 'El item no pertenece al proyecto del sprint');
      const item = await tx.sprintItem.create({ data: body as Prisma.SprintItemUncheckedCreateInput, include });
      await tx.backlogItem.update({ where: { id: item.backlogItemId }, data: { status: item.state === 'done' ? 'done' : 'in_sprint' } });
      return item;
    });
  },
  update: async (id: string, body: JsonObject) => prisma.$transaction(async (tx) => {
    const data = { ...body } as Prisma.SprintItemUncheckedUpdateInput;
    if (body.state === 'done') data.completedAt = new Date();
    if (body.state && body.state !== 'done') data.completedAt = null;
    const item = await tx.sprintItem.update({ where: { id }, data, include });
    await tx.backlogItem.update({ where: { id: item.backlogItemId }, data: { status: item.state === 'done' ? 'done' : 'in_sprint' } });
    return item;
  }),
  remove: (id: string) => prisma.sprintItem.delete({ where: { id } }),
};
