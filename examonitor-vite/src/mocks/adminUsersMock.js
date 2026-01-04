// src/mocks/adminUsersMock.js

import { normalizeRole } from "../handlers/authHandlers"; // Reuse role normalization from auth

export const ADMIN_USER_STATUS = ["active", "inactive"]; // Allowed user statuses

export function normalizeStatus(status) { // Normalize status to safe values
  const s = String(status || "").trim().toLowerCase(); // Normalize to lowercase string
  return ADMIN_USER_STATUS.includes(s) ? s : "active"; // Default to active
} // End normalizeStatus

let users = [ // In-memory mock users list
  { id: "u1", username: "admin1", name: "Admin One", role: "admin", status: "active", permissions: ["USERS_READ", "USERS_WRITE"] }, // Admin
  { id: "u2", username: "lecturer1", name: "Lecturer One", role: "lecturer", status: "active", permissions: ["EXAMS_READ"] }, // Lecturer
  { id: "u3", username: "invigilator1", name: "Invigilator One", role: "invigilator", status: "active", permissions: ["ATTENDANCE_READ"] }, // Invigilator
  { id: "u4", username: "student1", name: "Student One", role: "student", status: "active", permissions: [] }, // Student
  { id: "u5", username: "student2", name: "Student Two", role: "student", status: "inactive", permissions: [] }, // Inactive student
]; // End users

export function listMockUsers() { // Return all users
  return [...users]; // Return a shallow copy
} // End listMockUsers

export function updateMockUser(userId, patch) { // Patch one user by id
  const id = String(userId || "").trim(); // Normalize id
  const idx = users.findIndex((u) => String(u.id) === id); // Find user index
  if (idx === -1) return { ok: false, message: "User not found" }; // Not found
  const current = users[idx]; // Current user
  const next = { ...current, ...patch }; // Apply patch
  next.role = normalizeRole(next.role); // Normalize role
  next.status = normalizeStatus(next.status); // Normalize status
  next.permissions = Array.isArray(next.permissions) ? next.permissions : []; // Normalize permissions
  users[idx] = next; // Save back
  return { ok: true, user: next }; // Return updated
} // End updateMockUser