/**
 * @fileoverview Routes for retrieving user notifications.
 */
import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

// GET /notifications - Get notifications for the current context
router.get('/', NotificationController.get);

export default router;
