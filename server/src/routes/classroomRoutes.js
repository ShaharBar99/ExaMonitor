/**
 * @fileoverview Routes for managing classrooms and supervisor assignments.
 */
import { Router } from 'express';
import { ClassroomController } from '../controllers/classroomController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

// GET /classrooms - List classrooms (optional filters)
router.get('/', ClassroomController.list);
// GET /classrooms/:id - Get details of a specific classroom
router.get('/:id', ClassroomController.getOne);
// POST /classrooms - Create a new classroom
router.post('/', ClassroomController.create);
// PATCH /classrooms/:id/assign - Assign supervisors to a classroom
router.patch('/:id/assign', ClassroomController.assign);
// GET /classrooms/supervisors/list - Get list of available supervisors
router.get('/supervisors/list', ClassroomController.getSupervisors);

export default router;
