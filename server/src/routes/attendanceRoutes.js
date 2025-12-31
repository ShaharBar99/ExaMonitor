import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', AttendanceController.list);
router.post('/mark', AttendanceController.mark);

router.post('/breaks/start', AttendanceController.startBreak);
router.post('/breaks/end', AttendanceController.endBreak);

export default router;
