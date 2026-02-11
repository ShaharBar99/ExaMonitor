/**
 * @fileoverview Routes for managing exams, including scheduling, lecturers, and status updates.
 */
import { Router } from 'express';
import { ExamController } from '../controllers/examController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// For now: any logged-in user can access exam endpoints.
// Later you can enforce role checks (supervisor/lecturer).
router.use(requireAuth);

// GET /exams/by-lecturer/:lecturerId - List exams for a specific lecturer
router.get('/by-lecturer/:lecturerId', ExamController.listExamsByLecturer);
// GET /exams/courses/:courseId/lecturers - List lecturers for a course
router.get('/courses/:courseId/lecturers', ExamController.listCourseLecturers);
// GET /exams/:id/lecturers - List lecturers assigned to an exam
router.get('/:id/lecturers', ExamController.listExamLecturers);
// POST /exams/:id/lecturers - Add a lecturer to an exam
router.post('/:id/lecturers', ExamController.addExamLecturer);
// DELETE /exams/:id/lecturers/:lecturerId - Remove a lecturer from an exam
router.delete('/:id/lecturers/:lecturerId', ExamController.removeExamLecturer);
// GET /exams/:id/available-lecturers - Get available lecturers for an exam
router.get('/:id/available-lecturers', ExamController.getAvailableExamLecturers);

// GET /exams/courses - List all courses
router.get('/courses', ExamController.listCourses);
// GET /exams - List all exams
router.get('/', ExamController.list);
// GET /exams/:id - Get specific exam details
router.get('/:id', ExamController.getOne);
// POST /exams - Create a new exam
router.post('/', ExamController.create);

// PATCH /exams/:id/status - Update exam status (active, finished, etc.)
router.patch('/:id/status', ExamController.updateStatus);
// PATCH /exams/:id/extra-time - Add extra time to an exam
router.patch('/:id/extra-time', ExamController.addExtraTime);
// GET /exams/:id/timing - Get exam timing details
router.get('/:id/timing', ExamController.getTiming);
// POST /exams/:id/broadcast - Broadcast a message to exam rooms
router.post('/:id/broadcast', ExamController.broadcastAnnouncement);

export default router;
