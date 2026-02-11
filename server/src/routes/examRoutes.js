import { Router } from 'express';
import { ExamController } from '../controllers/examController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// For now: any logged-in user can access exam endpoints.
// Later you can enforce role checks (supervisor/lecturer).
router.use(requireAuth);

router.get('/by-lecturer/:lecturerId', ExamController.listExamsByLecturer);
router.get('/courses/:courseId/lecturers', ExamController.listCourseLecturers);
router.get('/:id/lecturers', ExamController.listExamLecturers);
router.post('/:id/lecturers', ExamController.addExamLecturer);
router.delete('/:id/lecturers/:lecturerId', ExamController.removeExamLecturer);
router.get('/:id/available-lecturers', ExamController.getAvailableExamLecturers);

router.get('/courses', ExamController.listCourses);
router.get('/', ExamController.list);
router.get('/:id', ExamController.getOne);
router.post('/', ExamController.create);

router.patch('/:id/status', ExamController.updateStatus);
router.patch('/:id/extra-time', ExamController.addExtraTime);
router.get('/:id/timing', ExamController.getTiming);
router.post('/:id/broadcast', ExamController.broadcastAnnouncement);

export default router;
