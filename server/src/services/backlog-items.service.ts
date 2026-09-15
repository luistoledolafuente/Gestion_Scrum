import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../models/prisma.js';
import type { JsonObject } from '../utils/payload.js';
import { requireFields } from '../utils/payload.js';

export const backlogItemsService = {
  list: (query: Record<string, unknown>) => prisma.backlogItem.findMany({ where: typeof query.projectId === 'string' ? { projectId: query.projectId } : {}, include: { sprintItems: true }, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] }),
  get: (id: string) => prisma.backlogItem.findUnique({ where: { id }, include: { project: true, sprintItems: { include: { sprint: true } } } }),
  create: (body: JsonObject) => {
    requireFields(body, ['projectId', 'title', 'description', 'type']);
    return prisma.backlogItem.create({ data: body as Prisma.BacklogItemUncheckedCreateInput });
  },
  update: (id: string, body: JsonObject) => prisma.backlogItem.update({ where: { id }, data: body as Prisma.BacklogItemUncheckedUpdateInput }),
  remove: (id: string) => prisma.backlogItem.delete({ where: { id } }),
};
