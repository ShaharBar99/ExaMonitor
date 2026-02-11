/**
 * @fileoverview Routes for reporting and managing exam incidents.
 */
import { Router } from 'express';
import { IncidentController } from '../controllers/incidentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

// POST /incidents - Report a new incident
router.post('/', IncidentController.report);
// GET /incidents - List incidents
router.get('/', IncidentController.list);
// POST /incidents/call-manager - Call floor manager to a room
router.post('/call-manager', IncidentController.callManager);
// GET /incidents/:id - List incidents by exam ID
router.get('/:id', IncidentController.listByExam);

export default router;
