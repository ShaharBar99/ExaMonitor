import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Protect everything under /admin
router.use(requireAuth, requireAdmin);

router.get('/users', AdminController.listUsers);
router.patch('/users/:id/role', AdminController.updateRole);
router.patch('/users/:id/status', AdminController.updateStatus);
router.put('/users/:id/permissions', AdminController.updatePermissions);

router.get('/audit', AdminController.getAudit);

router.get('/security/alerts', AdminController.listSecurityAlerts);
router.post('/security/alerts/:id/resolve', AdminController.resolveSecurityAlert);

export default router;
