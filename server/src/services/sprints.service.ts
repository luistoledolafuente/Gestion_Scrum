import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../models/prisma.js';
import type { JsonObject } from '../utils/payload.js';
import { requireFields, withDates } from '../utils/payload.js';

const include = { project: true, items: { include: { backlogItem: true }, orderBy: { createdAt: 'asc' as const } }, retrospective: true };

export const sprintsService = {
  list: (query: Record<string, unknown>) => prisma.sprint.findMany({ where: typeof query.projectId === 'string' ? { projectId: query.projectId } : {}, include, orderBy: { startDate: 'desc' } }),
  get: (id: string) => prisma.sprint.findUnique({ where: { id }, include }),
  create: (body: JsonObject) => {
    requireFields(body, ['projectId', 'name', 'goal', 'startDate', 'endDate']);
    return prisma.sprint.create({ data: withDates(body, ['startDate', 'endDate']) as Prisma.SprintUncheckedCreateInput, include });
  },
  update: (id: string, body: JsonObject) => prisma.sprint.update({ where: { id }, data: withDates(body, ['startDate', 'endDate']) as Prisma.SprintUncheckedUpdateInput, include }),
  remove: (id: string) => prisma.sprint.delete({ where: { id } }),
};
