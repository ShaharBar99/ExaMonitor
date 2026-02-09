import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Protect everything under /admin
router.use(requireAuth);

router.get('/users', AdminController.listUsers);
router.patch('/users/:id/role', AdminController.updateRole);
router.patch('/users/:id/status', AdminController.updateStatus);
router.put('/users/:id/permissions', AdminController.updatePermissions);

import multer from 'multer';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.get('/audit', AdminController.getAudit);

// Exams
router.get('/exams', AdminController.listExams);
router.post('/exams', AdminController.createExam);
router.delete('/exams/:id', AdminController.deleteExam);

router.post('/users', AdminController.createUser);
router.delete('/users/:id', AdminController.deleteUser);
router.post('/users/bulk', upload.single('file'), AdminController.bulkCreateUsers);
router.post('/exams/import', upload.single('file'), AdminController.importExams);

// Courses
router.get('/courses', AdminController.listCourses);
router.post('/courses', AdminController.createCourse);
router.post('/courses/import', upload.single('file'), AdminController.importCourses);
router.patch('/courses/:id', AdminController.updateCourse);
router.delete('/courses/:id', AdminController.deleteCourse);

// Course Students
router.get('/courses/:id/students', AdminController.getCourseStudents);
router.get('/courses/:id/available-students', AdminController.getAvailableStudents);
router.post('/courses/:id/students', AdminController.addStudentToCourse);
router.post('/courses/:id/students/bulk', upload.single('file'), AdminController.bulkAddStudentsToCourse);
router.delete('/courses/:courseId/students/:studentId', AdminController.removeStudentFromCourse);

// Classrooms
router.get('/classrooms', AdminController.listClassrooms);
router.get('/classrooms/supervisors/list', AdminController.getSupervisorsForAssignment);
router.post('/classrooms', AdminController.createClassroom);
router.post('/classrooms/import', upload.single('file'), AdminController.importClassrooms);
router.patch('/classrooms/:id', AdminController.updateClassroom);
router.delete('/classrooms/:id', AdminController.deleteClassroom);
router.patch('/classrooms/:id/assign', AdminController.assignSupervisors);

router.get('/security/alerts', AdminController.listSecurityAlerts);
router.post('/security/alerts/:id/resolve', AdminController.resolveSecurityAlert);

export default router;
