// examonitor-vite/src/api/studentApi.js

import { apiFetch } from "./http"; // Import shared fetch wrapper

export async function fetchMyStudentExams() { // API function
  return apiFetch("/api/student/exams", { method: "GET" }); // Call backend endpoint
} // End function
