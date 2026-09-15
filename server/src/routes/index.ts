import { Router } from 'express';
import { clientPortal } from '../controllers/client-portal.controller.js';
import { sprintMetrics } from '../controllers/metrics.controller.js';
import { calendarEventController } from '../controllers/calendar-event.controller.js';
import { portfolioReport } from '../controllers/reports.controller.js';
import authRoutes from './auth.routes.js';
import googleIntegrationRoutes from './google-integration.routes.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import crudRoutes from './crud.routes.js';

const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.get('/client-portal/:token', clientPortal);
router.use('/integrations/google', requireAuth, googleIntegrationRoutes);
router.use(requireAuth);
router.get('/metrics/sprint/:id', sprintMetrics);
router.get('/reports/portfolio', portfolioReport);
router.get('/calendar-events', calendarEventController.list);
router.get('/calendar-events/:id', calendarEventController.get);
router.post('/calendar-events', calendarEventController.create);
router.patch('/calendar-events/:id', calendarEventController.update);
router.delete('/calendar-events/:id', calendarEventController.remove);
router.use(crudRoutes);

export default router;
