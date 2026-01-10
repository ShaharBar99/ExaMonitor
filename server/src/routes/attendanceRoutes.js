import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', AttendanceController.list);
router.post('/mark', AttendanceController.mark);

router.post('/breaks/start', AttendanceController.startBreak);
router.post('/breaks/end', AttendanceController.endBreak);

router.patch('/students/:studentId/status', AttendanceController.updateStudentStatus);
router.get('/exams/floor/:floorId', AttendanceController.getExamsOnFloor);
router.patch('/rooms/:roomId/supervisor', AttendanceController.assignSupervisor);
router.get('/rooms/summary', AttendanceController.getFloorSummary);
router.get('/supervisor/:supervisorId/exam/:examId/students', AttendanceController.getStudentsForSupervisor);

router.post('/add-manual', AttendanceController.addStudent);
router.delete('/:attendanceId', AttendanceController.removeStudent);
router.get('/exams/:examId/eligible-students', AttendanceController.getEligibleStudents);
export default router;
