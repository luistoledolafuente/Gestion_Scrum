import { prisma } from '../models/prisma.js';
import type { WorkspaceAccess } from '../types/workspace.js';
import { HttpError } from '../utils/http-error.js';

const manageableRoles = ['ADMIN', 'EDITOR', 'CLIENT'] as const;
type AssignableRole = typeof manageableRoles[number];

const requireManager = (access: WorkspaceAccess) => {
  if (access.role !== 'OWNER' && access.role !== 'ADMIN') throw new HttpError(403, 'Solo propietarios y administradores pueden gestionar accesos.');
};

const parseRole = (value: unknown): AssignableRole => {
  const role = String(value || '').toUpperCase();
  if (!manageableRoles.includes(role as AssignableRole)) throw new HttpError(400, 'Selecciona un rol válido.');
  return role as AssignableRole;
};

const memberInclude = { user: { select: { id: true, name: true, email: true, pictureUrl: true } } };

export const workspacesService = {
  current: (access: WorkspaceAccess) => prisma.workspace.findUniqueOrThrow({ where: { id: access.workspaceId } }),

  members: (access: WorkspaceAccess) => prisma.workspaceMember.findMany({
    where: { workspaceId: access.workspaceId },
    include: memberInclude,
    orderBy: { createdAt: 'asc' },
  }),

  addMember: async (body: Record<string, unknown>, access: WorkspaceAccess) => {
    requireManager(access);
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Ingresa un correo válido.');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new HttpError(404, 'Esa persona todavía no tiene una cuenta. Pídele que se registre primero.');
    const existing = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: access.workspaceId, userId: user.id } } });
    if (existing) throw new HttpError(409, 'Esta persona ya pertenece al espacio de trabajo.');
    return prisma.workspaceMember.create({ data: { workspaceId: access.workspaceId, userId: user.id, role: parseRole(body.role) }, include: memberInclude });
  },

  updateMember: async (memberId: string, body: Record<string, unknown>, access: WorkspaceAccess) => {
    requireManager(access);
    const member = await prisma.workspaceMember.findFirst({ where: { id: memberId, workspaceId: access.workspaceId } });
    if (!member) throw new HttpError(404, 'Miembro no encontrado.');
    if (member.role === 'OWNER') throw new HttpError(400, 'El rol del propietario no se puede cambiar desde aquí.');
    return prisma.workspaceMember.update({ where: { id: memberId }, data: { role: parseRole(body.role) }, include: memberInclude });
  },

  removeMember: async (memberId: string, access: WorkspaceAccess) => {
    requireManager(access);
    const member = await prisma.workspaceMember.findFirst({ where: { id: memberId, workspaceId: access.workspaceId } });
    if (!member) throw new HttpError(404, 'Miembro no encontrado.');
    if (member.role === 'OWNER') throw new HttpError(400, 'No puedes eliminar al propietario del espacio.');
    return prisma.workspaceMember.delete({ where: { id: memberId } });
  },
};
