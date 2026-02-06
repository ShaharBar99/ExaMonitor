// src/api/usersApi.js

import { apiFetch } from "./http"; // REST fetch wrapper
import { listMockUsers, updateMockUser } from "../mocks/adminUsersMock"; // Mock helpers

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true"; // Use same flag for now

export async function listUsers(params = {}) { // GET /admin/users
  if (useMock) { // Mock path
    return { users: listMockUsers() }; // Return mock response shape
  } // End mock

  const q = new URLSearchParams(); // Build query params
  if (params.search) q.set("q", params.search); // search query
  if (params.role) q.set("role", params.role); // role filter
  if (params.status) q.set("status", params.status); // status filter

  const suffix = q.toString() ? `?${q.toString()}` : ""; // Query suffix
  return apiFetch(`/admin/users${suffix}`, { method: "GET", token: params.token }); // Call REST
} // End listUsers

export async function setUserStatus(userId, status, token) { // PATCH /admin/users/:id/status
  if (useMock) { // Mock path
    const res = updateMockUser(userId, { status }); // Update status in memory
    if (!res.ok) throw new Error(res.message); // Throw for handler to catch
    return { user: res.user }; // Return response shape
  } // End mock

  return apiFetch(`/admin/users/${encodeURIComponent(userId)}/status`, { // REST call
    method: "PATCH", // PATCH
    body: { status }, // JSON body
    token, // Auth token
  }); // End apiFetch
} // End setUserStatus

export async function updateUserPermissions(userId, permissions, token) { // PUT /admin/users/:id/permissions
  if (useMock) { // Mock path
    const res = updateMockUser(userId, { permissions }); // Update permissions in memory
    if (!res.ok) throw new Error(res.message); // Throw error
    return { user: res.user }; // Return response shape
  } // End mock

  return apiFetch(`/admin/users/${encodeURIComponent(userId)}/permissions`, { // REST call
    method: "PUT", // PUT
    body: { permissions }, // JSON body
    token, // Auth token
  }); // End apiFetch
} // End updateUserPermissions

export async function setUserRole(userId, role, token) { // PATCH /admin/users/:id/role
  if (useMock) { // Mock path
    const res = updateMockUser(userId, { role }); // Update role in memory
    if (!res.ok) throw new Error(res.message); // Throw error
    return { user: res.user }; // Return response shape
  } // End mock

  return apiFetch(`/admin/users/${encodeURIComponent(userId)}/role`, { // REST call
    method: "PATCH", // PATCH
    body: { role }, // JSON body
    token, // Auth token
  }); // End apiFetch
} // End setUserRole

export async function createUser(userData, token) {
  if (useMock) {
    return { user: { ...userData, id: "mock-new-id" } };
  }
  return apiFetch("/admin/users", {
    method: "POST",
    body: userData,
    token,
  });
  return apiFetch("/admin/users", {
    method: "POST",
    body: userData,
    token,
  });
}

export async function deleteUser(userId, token) {
  if (useMock) {
    return { success: true };
  }
  return apiFetch(`/admin/users/${userId}`, {
    method: "DELETE",
    token
  });
}

export async function bulkCreateUsers(formData, token) {
  if (useMock) {
    return { success: 1, failed: 0, errors: [] };
  }
  // Note: ensure apiFetch handles FormData correctly (does not set Content-Type to json)
  // For now assuming apiFetch checks if body is FormData
  return apiFetch("/admin/users/bulk", {
    method: "POST",
    body: formData,
    token,
  });
}

export async function searchLecturerByEmail(email) {
  if (useMock) {
    return { users: [] };
  }
  const q = new URLSearchParams();
  q.set("search", email);
  q.set("role", "lecturer");
  return apiFetch(`/admin/users?${q.toString()}`, { method: "GET" });
}
