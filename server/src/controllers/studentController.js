// src/controllers/studentController.js

import { studentService } from "../services/studentService.js"; // Import service

export async function getMyExams(req, res) { // Controller handler
  try { // Try block
    const studentId = req.user.id; // Read student id from auth middleware
    if (!studentId) { // If missing
      return res.status(401).json({ message: "Unauthorized" }); // Return 401
    } // End check

    const exams = await studentService.getStudentExamsByStudentId(studentId); // Fetch exams
    return res.status(200).json({ exams }); // Return exams
  } catch (err) { // Catch errors
    return res.status(500).json({ message: "Failed to load student exams", error: err?.message }); // Return 500
  } // End try/catch
} // End controller
