import { Router } from 'express';
import { ClassroomController } from '../controllers/classroomController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', ClassroomController.list);
router.get('/:id', ClassroomController.getOne);
router.post('/', ClassroomController.create);
router.patch('/:id/assign', ClassroomController.assign);

export default router;
