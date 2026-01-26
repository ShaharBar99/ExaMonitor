import { Router } from 'express';
import { IncidentController } from '../controllers/incidentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', IncidentController.report);
router.get('/', IncidentController.list);
router.post('/call-manager', IncidentController.callManager);
router.get('/:id', IncidentController.listByExam);

export default router;
