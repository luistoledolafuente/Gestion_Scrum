import { Router } from 'express';
import { googleIntegrationController } from '../controllers/google-integration.controller.js';

const router = Router();
router.get('/status', googleIntegrationController.status);
router.post('/connect', googleIntegrationController.connect);
router.get('/callback', googleIntegrationController.callback);
router.delete('/connection', googleIntegrationController.disconnect);

export default router;
