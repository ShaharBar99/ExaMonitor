import { Router } from 'express';
import { ExamController } from '../controllers/examController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// For now: any logged-in user can access exam endpoints.
// Later you can enforce role checks (supervisor/lecturer).
router.use(requireAuth);

router.get('/', ExamController.list);
router.get('/:id', ExamController.getOne);
router.post('/', ExamController.create);

router.patch('/:id/status', ExamController.updateStatus);
router.patch('/:id/extra-time', ExamController.addExtraTime);

export default router;
