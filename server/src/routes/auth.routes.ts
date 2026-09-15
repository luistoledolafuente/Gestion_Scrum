import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/google/start', authController.googleStart);
router.get('/google/callback', authController.googleCallback);
router.get('/me', requireAuth, authController.me);
router.post('/logout', requireAuth, authController.logout);

export default router;
