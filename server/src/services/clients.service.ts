import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../models/prisma.js';
import type { JsonObject } from '../utils/payload.js';
import { requireFields } from '../utils/payload.js';
import { HttpError } from '../utils/http-error.js';
import type { WorkspaceAccess } from '../types/workspace.js';

const requireClient = async (id: string, workspaceId: string) => {
  const client = await prisma.client.findFirst({ where: { id, workspaceId } });
  if (!client) throw new HttpError(404, 'Cliente no encontrado');
  return client;
};

export const clientsService = {
  list: (_query: Record<string, unknown>, access: WorkspaceAccess) => prisma.client.findMany({ where: { workspaceId: access.workspaceId }, include: { _count: { select: { projects: true } } }, orderBy: { name: 'asc' } }),
  get: (id: string, access: WorkspaceAccess) => prisma.client.findFirst({ where: { id, workspaceId: access.workspaceId }, include: { projects: true } }),
  create: (body: JsonObject, access: WorkspaceAccess) => {
    requireFields(body, ['name', 'email']);
    return prisma.client.create({ data: { ...body, workspaceId: access.workspaceId } as Prisma.ClientUncheckedCreateInput });
  },
  update: async (id: string, body: JsonObject, access: WorkspaceAccess) => {
    await requireClient(id, access.workspaceId);
    const { workspaceId: _ignored, ...safeBody } = body;
    return prisma.client.update({ where: { id }, data: safeBody as Prisma.ClientUpdateInput });
  },
  remove: async (id: string, access: WorkspaceAccess) => {
    await requireClient(id, access.workspaceId);
    const projects = await prisma.project.count({ where: { clientId: id, workspaceId: access.workspaceId } });
    if (projects) throw new HttpError(409, 'No puedes eliminar un cliente que todavía tiene proyectos asociados.');
    return prisma.client.delete({ where: { id } });
  },
};
