import { Router } from 'express';
import { workspacesController } from '../controllers/workspaces.controller.js';

const router = Router();
router.get('/current', workspacesController.current);
router.get('/current/members', workspacesController.members);
router.post('/current/members', workspacesController.addMember);
router.patch('/current/members/:memberId', workspacesController.updateMember);
router.delete('/current/members/:memberId', workspacesController.removeMember);

export default router;
