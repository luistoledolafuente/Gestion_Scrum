import { prisma } from '../models/prisma.js';
import { HttpError } from '../utils/http-error.js';
import type { WorkspaceAccess } from '../types/workspace.js';

const dayKey = (date: Date) => date.toISOString().slice(0, 10);
const nextDay = (date: Date) => new Date(date.getTime() + 86_400_000);

export const getSprintMetrics = async (id: string, access: WorkspaceAccess) => {
  const sprint = await prisma.sprint.findFirst({
    where: { id, project: { workspaceId: access.workspaceId } },
    include: { items: { include: { backlogItem: { select: { storyPoints: true } } } } },
  });
  if (!sprint) throw new HttpError(404, 'Sprint no encontrado');

  const totalPoints = sprint.items.reduce((sum, item) => sum + item.backlogItem.storyPoints, 0);
  const completedPoints = sprint.items.filter((item) => item.state === 'done').reduce((sum, item) => sum + item.backlogItem.storyPoints, 0);
  const progressPercentage = totalPoints ? Math.round((completedPoints / totalPoints) * 100) : 0;
  const start = new Date(Date.UTC(sprint.startDate.getUTCFullYear(), sprint.startDate.getUTCMonth(), sprint.startDate.getUTCDate()));
  const end = new Date(Date.UTC(sprint.endDate.getUTCFullYear(), sprint.endDate.getUTCMonth(), sprint.endDate.getUTCDate()));
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
  const burndown = [];

  for (let date = start, index = 0; date <= end; date = nextDay(date), index += 1) {
    const completedByDate = sprint.items
      .filter((item) => item.completedAt && item.completedAt < nextDay(date))
      .reduce((sum, item) => sum + item.backlogItem.storyPoints, 0);
    burndown.push({
      date: dayKey(date),
      idealPoints: Math.max(0, Math.round(totalPoints * (1 - index / days))),
      remainingPoints: date <= todayUtc ? Math.max(0, totalPoints - completedByDate) : null,
    });
  }

  return { sprintId: id, totalPoints, completedPoints, progressPercentage, burndown };
};
