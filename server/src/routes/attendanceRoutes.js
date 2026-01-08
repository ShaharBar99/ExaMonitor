import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', AttendanceController.list);
router.post('/mark', AttendanceController.mark);

router.post('/breaks/start', AttendanceController.startBreak);
router.post('/breaks/end', AttendanceController.endBreak);

router.get('/rooms/:roomId/students', AttendanceController.getStudentsByRoom);
router.patch('/students/:studentId/status', AttendanceController.updateStudentStatus);
router.get('/exams/floor/:floorId', AttendanceController.getExamsOnFloor);
router.patch('/rooms/:roomId/supervisor', AttendanceController.assignSupervisor);
router.get('/rooms/summary', AttendanceController.getFloorSummary);

export default router;
