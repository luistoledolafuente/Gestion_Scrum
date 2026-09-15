import { prisma } from '../models/prisma.js';

export const getPortfolioReport = async () => {
  const now = new Date();
  const [projects, sprints, upcomingMeetings] = await Promise.all([
    prisma.project.findMany({
      include: { client: { select: { name: true, companyName: true } }, backlogItems: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.sprint.findMany({
      include: { project: { select: { id: true, name: true } }, items: { include: { backlogItem: { select: { storyPoints: true } } } } },
      orderBy: { endDate: 'desc' },
    }),
    prisma.calendarEvent.count({ where: { status: 'SCHEDULED', startDateTime: { gte: now } } }),
  ]);

  const allItems = projects.flatMap((project) => project.backlogItems);
  const totalPoints = allItems.reduce((sum, item) => sum + item.storyPoints, 0);
  const completedPoints = allItems.filter((item) => item.status === 'done').reduce((sum, item) => sum + item.storyPoints, 0);
  const overallProgress = totalPoints ? Math.round((completedPoints / totalPoints) * 100) : 0;

  const projectProgress = projects.map((project) => {
    const points = project.backlogItems.reduce((sum, item) => sum + item.storyPoints, 0);
    const done = project.backlogItems.filter((item) => item.status === 'done').reduce((sum, item) => sum + item.storyPoints, 0);
    return {
      id: project.id,
      name: project.name,
      client: project.client.companyName || project.client.name,
      status: project.status,
      progress: points ? Math.round((done / points) * 100) : 0,
      completedPoints: done,
      totalPoints: points,
      blockers: project.blockers,
      endDate: project.endDate,
    };
  });

  const velocity = sprints
    .filter((sprint) => sprint.status === 'completed')
    .slice(0, 8)
    .reverse()
    .map((sprint) => ({
      id: sprint.id,
      sprint: sprint.name,
      project: sprint.project.name,
      points: sprint.items.filter((item) => item.state === 'done').reduce((sum, item) => sum + item.backlogItem.storyPoints, 0),
    }));

  const countBy = <T extends string>(values: T[], keys: T[]) => keys.map((key) => ({ name: key, value: values.filter((value) => value === key).length }));

  return {
    generatedAt: new Date().toISOString(),
    overview: {
      totalProjects: projects.length,
      activeProjects: projects.filter((project) => project.status === 'active').length,
      runningSprints: sprints.filter((sprint) => sprint.status === 'in_progress').length,
      upcomingMeetings,
      totalPoints,
      completedPoints,
      overallProgress,
    },
    projectStatus: countBy(projects.map((project) => project.status), ['active', 'paused', 'done']),
    workStatus: countBy(allItems.map((item) => item.status), ['backlog', 'in_sprint', 'done']),
    velocity,
    projectProgress,
    risks: {
      blockedProjects: projects.filter((project) => Boolean(project.blockers?.trim())).length,
      highPriorityOpenItems: allItems.filter((item) => item.priority === 'high' && item.status !== 'done').length,
    },
  };
};
