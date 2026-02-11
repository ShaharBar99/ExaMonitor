/**
 * @fileoverview Routes for managing student attendance, breaks, and supervisor assignments.
 * All routes are protected and require authentication.
 */
import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

// GET /attendance - List attendance records (filtered by classroom or exam)
router.get('/', AttendanceController.list);
// POST /attendance/mark - Mark a student's attendance (check-in/out)
router.post('/mark', AttendanceController.mark);

// POST /attendance/breaks/start - Start a break for a student
router.post('/breaks/start', AttendanceController.startBreak);
// POST /attendance/breaks/end - End a break for a student
router.post('/breaks/end', AttendanceController.endBreak);
// GET /attendance/breaks/count - Get count of active breaks for an exam
router.get('/breaks/count', AttendanceController.getBreaksCount);

// PATCH /attendance/students/:studentId/status - Update specific student status
router.patch('/students/:studentId/status', AttendanceController.updateStudentStatus);
// GET /attendance/exams/floor/:floorId - Get exams on a specific floor
router.get('/exams/floor/:floorId', AttendanceController.getExamsOnFloor);
// PATCH /attendance/rooms/:roomId/supervisor - Assign supervisor to a room
router.patch('/rooms/:roomId/supervisor', AttendanceController.assignSupervisor);
// GET /attendance/rooms/summary - Get summary for floor supervisor
router.get('/rooms/summary', AttendanceController.getFloorSummary);
// GET /attendance/supervisor/:supervisorId/exam/:examId/students - Get students for a specific supervisor
router.get('/supervisor/:supervisorId/exam/:examId/students', AttendanceController.getStudentsForSupervisor);

// POST /attendance/add-manual - Manually add a student to attendance
router.post('/add-manual', AttendanceController.addStudent);
// DELETE /attendance/:attendanceId - Remove a student from attendance
router.delete('/:attendanceId', AttendanceController.removeStudent);
// GET /attendance/exams/:examId/eligible-students - Search students eligible for an exam
router.get('/exams/:examId/eligible-students', AttendanceController.getEligibleStudents);
export default router;
