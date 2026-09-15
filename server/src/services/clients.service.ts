import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../models/prisma.js';
import type { JsonObject } from '../utils/payload.js';
import { requireFields } from '../utils/payload.js';

export const clientsService = {
  list: () => prisma.client.findMany({ include: { _count: { select: { projects: true } } }, orderBy: { name: 'asc' } }),
  get: (id: string) => prisma.client.findUnique({ where: { id }, include: { projects: true } }),
  create: (body: JsonObject) => {
    requireFields(body, ['name', 'email']);
    return prisma.client.create({ data: body as Prisma.ClientCreateInput });
  },
  update: (id: string, body: JsonObject) => prisma.client.update({ where: { id }, data: body as Prisma.ClientUpdateInput }),
  remove: (id: string) => prisma.client.delete({ where: { id } }),
};
