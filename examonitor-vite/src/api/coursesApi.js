// src/api/coursesApi.js

import { apiFetch } from "./http";

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";

/**
 * GET /admin/courses
 * Fetch all courses with optional filters
 */
export async function listCourses(params = {}) {
  if (useMock) {
    return { courses: [] };
  }

  const q = new URLSearchParams();
  if (params.search) q.set("q", params.search);
  if (params.lecturer_id) q.set("lecturer_id", params.lecturer_id);

  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch(`/admin/courses${suffix}`, { method: "GET" });
}

/**
 * POST /admin/courses
 * Create a new course
 */
export async function createCourse(courseData, token) {
  if (useMock) {
    return { course: { ...courseData, id: "mock-new-id" } };
  }

  return apiFetch("/admin/courses", {
    method: "POST",
    body: courseData,
    token,
  });
}

/**
 * PATCH /admin/courses/:id
 * Update course details
 */
export async function updateCourse(courseId, courseData, token) {
  if (useMock) {
    return { course: { ...courseData, id: courseId } };
  }

  return apiFetch(`/admin/courses/${encodeURIComponent(courseId)}`, {
    method: "PATCH",
    body: courseData,
    token,
  });
}

/**
 * DELETE /admin/courses/:id
 * Delete a course
 */
export async function deleteCourse(courseId, token) {
  if (useMock) {
    return { ok: true };
  }

  return apiFetch(`/admin/courses/${encodeURIComponent(courseId)}`, {
    method: "DELETE",
    token,
  });
}

/**
 * POST /admin/courses/:id/students
 * Add a single student to a course
 */
export async function addStudentToCourse(courseId, studentData, token) {
  if (useMock) {
    return { ok: true, registration: { id: "mock-id", ...studentData } };
  }

  return apiFetch(`/admin/courses/${encodeURIComponent(courseId)}/students`, {
    method: "POST",
    body: studentData,
    token,
  });
}

/**
 * POST /admin/courses/:id/students/bulk
 * Bulk import students to a course from Excel
 */
export async function bulkAddStudentsToCourse(courseId, formData) {
  if (useMock) {
    return { ok: true, imported: 0 };
  }

  // Get token from storage (same as apiFetch)
  const token = localStorage.getItem("token") ?? sessionStorage.getItem("token");

  // Use raw fetch for FormData (apiFetch expects JSON)
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const apiUrl = import.meta.env.VITE_API_BASE || "http://localhost:5000";
  const response = await fetch(`${apiUrl}/admin/courses/${encodeURIComponent(courseId)}/students/bulk`, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to import students");
  }

  return response.json();
}

/**
 * GET /admin/courses/:id/students
 * Get students in a course
 */
export async function getCourseStudents(courseId, token) {
  if (useMock) {
    return { students: [] };
  }

  return apiFetch(`/admin/courses/${encodeURIComponent(courseId)}/students`, {
    method: "GET",
    token,
  });
}

/**
 * DELETE /admin/courses/:courseId/students/:studentId
 * Remove a student from a course
 */
export async function removeStudentFromCourse(courseId, studentId, token) {
  if (useMock) {
    return { ok: true };
  }

  return apiFetch(`/admin/courses/${encodeURIComponent(courseId)}/students/${encodeURIComponent(studentId)}`, {
    method: "DELETE",
    token,
  });
}
/**
 * POST /admin/courses/import
 * Import courses from Excel file
 */
export async function importCourses(formData) {
  console.log("coursesApi: importCourses called");
  if (useMock) {
    return { ok: true, imported: 0 };
  }

  // Get token from storage (same as apiFetch)
  const token = localStorage.getItem("token") ?? sessionStorage.getItem("token");

  // Use raw fetch for FormData (apiFetch expects JSON)
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const apiUrl = import.meta.env.VITE_API_BASE || "http://localhost:5000";
  console.log(`coursesApi: Sending POST request to ${apiUrl}/admin/courses/import`);
  const response = await fetch(`${apiUrl}/admin/courses/import`, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });
  console.log("coursesApi: Response status:", response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("coursesApi: Response error:", error);
    throw new Error(error.error || "Failed to import courses");
  }

  return response.json();
}

/**
 * GET /admin/courses/:id/available-students
 * Get students not yet enrolled in a course
 */
export async function getAvailableStudents(courseId) {
  if (useMock) {
    return { students: [] };
  }

  return apiFetch(`/admin/courses/${encodeURIComponent(courseId)}/available-students`, {
    method: "GET",
  });
}