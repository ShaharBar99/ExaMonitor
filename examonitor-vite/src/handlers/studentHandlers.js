// examonitor-vite/src/handlers/studentHandlers.js

import { fetchMyStudentExams } from "../api/studentApi"; // Import API call

export async function loadStudentExams(setState) { // Handler to load exams
  setState((s) => ({ ...s, loading: true, error: "" })); // Set loading true
  try { // Try block
    const data = await fetchMyStudentExams(); // Fetch from server
    setState((s) => ({ ...s, loading: false, exams: data.exams || [], error: "" })); // Store exams
    return { ok: true }; // Return ok
  } catch (err) { // Catch errors
    setState((s) => ({ ...s, loading: false, error: err?.message || "Failed to load exams" })); // Store error
    return { ok: false, error: err }; // Return not ok
  } // End try/catch
} // End handler
