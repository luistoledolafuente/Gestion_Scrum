import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../models/prisma.js';
import type { JsonObject } from '../utils/payload.js';
import { requireFields } from '../utils/payload.js';

export const retrospectivesService = {
  list: (query: Record<string, unknown>) => prisma.retrospective.findMany({ where: typeof query.sprintId === 'string' ? { sprintId: query.sprintId } : {}, include: { sprint: true }, orderBy: { createdAt: 'desc' } }),
  get: (id: string) => prisma.retrospective.findUnique({ where: { id }, include: { sprint: true } }),
  create: (body: JsonObject) => {
    requireFields(body, ['sprintId', 'whatWentWell', 'whatDidNotGoWell', 'actions']);
    return prisma.retrospective.create({ data: body as Prisma.RetrospectiveUncheckedCreateInput });
  },
  update: (id: string, body: JsonObject) => prisma.retrospective.update({ where: { id }, data: body as Prisma.RetrospectiveUncheckedUpdateInput }),
  remove: (id: string) => prisma.retrospective.delete({ where: { id } }),
};
