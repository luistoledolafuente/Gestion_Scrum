import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../models/prisma.js';
import type { JsonObject } from '../utils/payload.js';
import { requireFields, withDates } from '../utils/payload.js';

const projectInclude = {
  client: true,
  sprints: { orderBy: { startDate: 'desc' as const } },
  backlogItems: { orderBy: { createdAt: 'desc' as const } },
  calendarEvents: { orderBy: { startDateTime: 'asc' as const } },
};

export const projectsService = {
  list: () => prisma.project.findMany({ include: projectInclude, orderBy: { updatedAt: 'desc' } }),
  get: (id: string) => prisma.project.findUnique({ where: { id }, include: projectInclude }),
  create: (body: JsonObject) => {
    requireFields(body, ['name', 'description', 'startDate', 'clientId']);
    return prisma.project.create({ data: withDates(body, ['startDate', 'endDate']) as Prisma.ProjectUncheckedCreateInput, include: projectInclude });
  },
  update: (id: string, body: JsonObject) => prisma.project.update({ where: { id }, data: withDates(body, ['startDate', 'endDate']) as Prisma.ProjectUncheckedUpdateInput, include: projectInclude }),
  remove: (id: string) => prisma.project.delete({ where: { id } }),
};
