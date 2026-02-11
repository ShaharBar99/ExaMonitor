import { apiFetch } from "./http"; // Import shared fetch wrapper

/**
 * Fetches the list of exams for the currently logged-in student.
 * Corresponds to GET /api/student/exams.
 *
 * @returns {Promise<{exams: Array}>} A promise that resolves to an object containing the list of exams.
 */
export async function fetchMyStudentExams() { // API function
  return apiFetch("/api/student/exams", { method: "GET" }); // Call backend endpoint
} // End function
