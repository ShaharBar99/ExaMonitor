// src/api/classroomsApi.js

import { apiFetch } from "./http";

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";

/**
 * GET /admin/classrooms
 * Fetch all classrooms with optional filters
 */
export async function listClassrooms(params = {}) {
  if (useMock) {
    return { classrooms: [] };
  }

  const q = new URLSearchParams();
  if (params.search) q.set("q", params.search);
  if (params.exam_id) q.set("exam_id", params.exam_id);

  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch(`/admin/classrooms${suffix}`, { method: "GET" });
}

/**
 * POST /admin/classrooms
 * Create a new classroom
 */
export async function createClassroom(classroomData, token) {
  if (useMock) {
    return { classroom: { ...classroomData, id: "mock-new-id" } };
  }

  return apiFetch("/admin/classrooms", {
    method: "POST",
    body: classroomData,
    token,
  });
}

/**
 * PATCH /admin/classrooms/:id
 * Update classroom details
 */
export async function updateClassroom(classroomId, classroomData, token) {
  if (useMock) {
    return { classroom: { ...classroomData, id: classroomId } };
  }

  return apiFetch(`/admin/classrooms/${encodeURIComponent(classroomId)}`, {
    method: "PATCH",
    body: classroomData,
    token,
  });
}

/**
 * DELETE /admin/classrooms/:id
 * Delete a classroom
 */
export async function deleteClassroom(classroomId, token) {
  if (useMock) {
    return { ok: true };
  }

  return apiFetch(`/admin/classrooms/${encodeURIComponent(classroomId)}`, {
    method: "DELETE",
    token,
  });
}

/**
 * PATCH /admin/classrooms/:id/assign
 * Assign supervisors to a classroom
 */
export async function assignSupervisorsToClassroom(classroomId, assignmentData, token) {
  if (useMock) {
    return { classroom: { ...assignmentData, id: classroomId } };
  }

  return apiFetch(`/admin/classrooms/${encodeURIComponent(classroomId)}/assign`, {
    method: "PATCH",
    body: assignmentData,
    token,
  });
}

/**
 * GET /admin/classrooms/:id
 * Get a single classroom
 */
export async function getClassroomById(classroomId, token) {
  if (useMock) {
    return { classroom: { id: classroomId } };
  }

  return apiFetch(`/admin/classrooms/${encodeURIComponent(classroomId)}`, {
    method: "GET",
    token,
  });
}

/**
 * GET /admin/classrooms/supervisors/list
 * Get available supervisors for assignment
 */
export async function getSupervisors(token) {
  if (useMock) {
    return { supervisors: [] };
  }

  return apiFetch("/admin/classrooms/supervisors/list", {
    method: "GET",
    token,
  });
}

/**
 * POST /admin/classrooms/import
 * Import classrooms from Excel file
 */
export async function importClassrooms(formData) {
  if (useMock) {
    return { ok: true, imported: 0 };
  }

  // Get token from storage (same as apiFetch)
  const token = localStorage.getItem("token") ?? sessionStorage.getItem("token");

  // Use raw fetch for FormData (apiFetch expects JSON)
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const apiUrl = import.meta.env.VITE_API_BASE || "http://localhost:5000";
  
  try {
    const response = await fetch(`${apiUrl}/admin/classrooms/import`, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `Server error: ${response.status}`);
    }

    return result;
  } catch (err) {
    console.error("Import API error:", err);
    throw err;
  }
}

/**
 * GET /admin/exams
 * Get exams list for classroom assignment
 */
export async function listExams(params = {}) {
  if (useMock) {
    return { exams: [] };
  }

  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);

  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch(`/admin/exams${suffix}`, { method: "GET" });
}
