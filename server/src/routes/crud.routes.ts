import { Router } from 'express';
import { createCrudController } from '../controllers/crud.controller.js';
import { clientsService } from '../services/clients.service.js';
import { projectsService } from '../services/projects.service.js';
import { sprintsService } from '../services/sprints.service.js';
import { backlogItemsService } from '../services/backlog-items.service.js';
import { sprintItemsService } from '../services/sprint-items.service.js';
import { retrospectivesService } from '../services/retrospectives.service.js';

const routes = Router();
const register = (path: string, service: Parameters<typeof createCrudController>[0]) => {
  const controller = createCrudController(service);
  routes.get(path, controller.list);
  routes.get(`${path}/:id`, controller.get);
  routes.post(path, controller.create);
  routes.put(`${path}/:id`, controller.update);
  routes.patch(`${path}/:id`, controller.update);
  routes.delete(`${path}/:id`, controller.remove);
};

register('/clients', clientsService);
register('/projects', projectsService);
register('/sprints', sprintsService);
register('/backlog-items', backlogItemsService);
register('/sprint-items', sprintItemsService);
register('/retrospectives', retrospectivesService);

export default routes;
