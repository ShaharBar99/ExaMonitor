/**
 * @fileoverview Routes for student-specific operations.
 */
import express from "express"; // Import express
import { getMyExams } from "../controllers/studentController.js"; // Import controller
import { requireAuth } from "../middleware/authMiddleware.js"; // Import your auth middleware (adjust name/path if different)

const router = express.Router(); // Create router

router.use(requireAuth);

// GET /api/student/exams - Get exams for the logged-in student
router.get("/exams", getMyExams); // GET /api/student/exams

export default router; // Export router