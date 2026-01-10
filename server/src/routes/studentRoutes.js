// src/routes/studentRoutes.js

import express from "express"; // Import express
import { getMyExams } from "../controllers/studentController.js"; // Import controller
import { requireAuth } from "../middleware/authMiddleware.js"; // Import your auth middleware (adjust name/path if different)

const router = express.Router(); // Create router

router.get("/exams", requireAuth, getMyExams); // GET /api/student/exams

export default router; // Export router