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

import multer from 'multer';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.get('/audit', AdminController.getAudit);

// Exams
router.get('/exams', AdminController.listExams);
router.post('/exams', AdminController.createExam);
router.delete('/exams/:id', AdminController.deleteExam);

router.post('/users', AdminController.createUser);
router.delete('/users/:id', AdminController.deleteUser);
router.post('/users/bulk', upload.single('file'), AdminController.bulkCreateUsers);
router.post('/exams/import', upload.single('file'), AdminController.importExams);

router.get('/security/alerts', AdminController.listSecurityAlerts);
router.post('/security/alerts/:id/resolve', AdminController.resolveSecurityAlert);

export default router;
