import { prisma } from '../models/prisma.js';
import { HttpError } from '../utils/http-error.js';

export const getClientPortal = async (token: string) => {
  const project = await prisma.project.findUnique({
    where: { publicPortalToken: token },
    include: {
      client: { select: { name: true, companyName: true } },
      backlogItems: { orderBy: { updatedAt: 'desc' } },
      sprints: { select: { id: true, name: true, goal: true, status: true, startDate: true, endDate: true }, orderBy: { startDate: 'desc' } },
    },
  });
  if (!project) throw new HttpError(404, 'Portal de cliente no encontrado');

  const totalPoints = project.backlogItems.reduce((sum, item) => sum + item.storyPoints, 0);
  const completedPoints = project.backlogItems.filter((item) => item.status === 'done').reduce((sum, item) => sum + item.storyPoints, 0);
  const progressPercentage = totalPoints ? Math.round((completedPoints / totalPoints) * 100) : 0;

  return {
    project: {
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      client: project.client,
    },
    progressPercentage,
    milestones: project.backlogItems.filter((item) => item.isKey).map(({ id, title, description, status, type }) => ({ id, title, description, status, type })),
    deliverables: project.deliverables,
    blockers: project.blockers,
    sprints: project.sprints,
  };
};
