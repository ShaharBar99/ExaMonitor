/**
 * @fileoverview This file provides an API for interacting with user data, supporting both mock and real backends.
 * It includes functions for listing, creating, updating, and deleting users, as well as managing their roles, statuses, and permissions.
 */

import { apiFetch } from "./http"; // REST fetch wrapper
import { listMockUsers, updateMockUser } from "../mocks/adminUsersMock"; // Mock helpers

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true"; // Use same flag for now

/**
 * Fetches a list of users from the server, with optional filtering.
 * Corresponds to the GET /admin/users endpoint.
 *
 * @param {object} [params={}] - The parameters for filtering the user list.
 * @param {string} [params.search] - A search query to filter users by name or username.
 * @param {string} [params.role] - Filter users by their role (e.g., 'admin', 'lecturer').
 * @param {string} [params.status] - Filter users by their status (e.g., 'active', 'inactive').
 * @returns {Promise<{users: Array<object>}>} A promise that resolves to an object containing an array of user objects.
 */
export async function listUsers(params = {}) {
  if (useMock) { // Mock path
    return { users: listMockUsers() }; // Return mock response shape
  } // End mock

  const q = new URLSearchParams(); // Build query params
  if (params.search) q.set("q", params.search); // search query
  if (params.role) q.set("role", params.role); // role filter
  if (params.status) q.set("status", params.status); // status filter

  const suffix = q.toString() ? `?${q.toString()}` : ""; // Query suffix
  return apiFetch(`/admin/users${suffix}`, { method: "GET" }); // Call REST
} // End listUsers

/**
 * Updates the status of a specific user.
 * Corresponds to the PATCH /admin/users/:id/status endpoint.
 *
 * @param {string|number} userId - The ID of the user to update.
 * @param {string} status - The new status for the user (e.g., 'active', 'inactive').
 * @returns {Promise<{user: object}>} A promise that resolves to an object containing the updated user.
 * @throws {Error} If the mock update fails.
 */
export async function setUserStatus(userId, status) {
  if (useMock) { // Mock path
    const res = updateMockUser(userId, { status }); // Update status in memory
    if (!res.ok) throw new Error(res.message); // Throw for handler to catch
    return { user: res.user }; // Return response shape
  } // End mock

  return apiFetch(`/admin/users/${encodeURIComponent(userId)}/status`, { // REST call
    method: "PATCH", // PATCH
    body: { status }, // JSON body
  }); // End apiFetch
} // End setUserStatus

/**
 * Updates the permissions for a specific user.
 * Corresponds to the PUT /admin/users/:id/permissions endpoint.
 *
 * @param {string|number} userId - The ID of the user whose permissions are to be updated.
 * @param {Array<string>} permissions - An array of permission strings.
 * @returns {Promise<{user: object}>} A promise that resolves to an object containing the updated user.
 * @throws {Error} If the mock update fails.
 */
export async function updateUserPermissions(userId, permissions) {
  if (useMock) { // Mock path
    const res = updateMockUser(userId, { permissions }); // Update permissions in memory
    if (!res.ok) throw new Error(res.message); // Throw error
    return { user: res.user }; // Return response shape
  } // End mock

  return apiFetch(`/admin/users/${encodeURIComponent(userId)}/permissions`, { // REST call
    method: "PUT", // PUT
    body: { permissions }, // JSON body
  }); // End apiFetch
} // End updateUserPermissions

/**
 * Sets the role for a specific user.
 * Corresponds to the PATCH /admin/users/:id/role endpoint.
 *
 * @param {string|number} userId - The ID of the user whose role is to be set.
 * @param {string} role - The new role for the user.
 * @returns {Promise<{user: object}>} A promise that resolves to an object containing the updated user.
 * @throws {Error} If the mock update fails.
 */
export async function setUserRole(userId, role) {
  if (useMock) { // Mock path
    const res = updateMockUser(userId, { role }); // Update role in memory
    if (!res.ok) throw new Error(res.message); // Throw error
    return { user: res.user }; // Return response shape
  } // End mock

  return apiFetch(`/admin/users/${encodeURIComponent(userId)}/role`, { // REST call
    method: "PATCH", // PATCH
    body: { role }, // JSON body
  }); // End apiFetch
} // End setUserRole

/**
 * Updates a user's data.
 * Corresponds to the PATCH /admin/users/:id endpoint.
 *
 * @param {string|number} userId - The ID of the user to update.
 * @param {object} userData - An object containing the user data to update.
 * @returns {Promise<{user: object}>} A promise that resolves to an object containing the updated user.
 * @throws {Error} If the mock update fails.
 */
export async function updateUser(userId, userData) {
  if (useMock) {
    const res = updateMockUser(userId, userData);
    if (!res.ok) throw new Error(res.message);
    return { user: res.user };
  }
  return apiFetch(`/admin/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: userData,
  });
}

/**
 * Creates a new user.
 * Corresponds to the POST /admin/users endpoint.
 *
 * @param {object} userData - An object containing the data for the new user.
 * @returns {Promise<{user: object}>} A promise that resolves to an object containing the newly created user.
 */
export async function createUser(userData) {
  if (useMock) {
    return { user: { ...userData, id: "mock-new-id" } };
  }
  return apiFetch("/admin/users", {
    method: "POST",
    body: userData,
  });
}

/**
 * Deletes a user.
 * Corresponds to the DELETE /admin/users/:id endpoint.
 *
 * @param {string|number} userId - The ID of the user to delete.
 * @returns {Promise<{success: boolean}>} A promise that resolves to an object indicating success.
 */
export async function deleteUser(userId) {
  if (useMock) {
    return { success: true };
  }
  return apiFetch(`/admin/users/${userId}`, {
    method: "DELETE",
  });
}

/**
 * Creates multiple users from a file upload (e.g., CSV).
 * Corresponds to the POST /admin/users/bulk endpoint.
 *
 * @param {FormData} formData - The form data containing the file for bulk user creation.
 * @returns {Promise<{success: number, failed: number, errors: Array<string>}>} A promise that resolves to a summary of the bulk creation process.
 */
export async function bulkCreateUsers(formData) {
  if (useMock) {
    return { success: 1, failed: 0, errors: [] };
  }
  // Note: ensure apiFetch handles FormData correctly (does not set Content-Type to json)
  // For now assuming apiFetch checks if body is FormData
  return apiFetch("/admin/users/bulk", {
    method: "POST",
    body: formData,
  });
}

/**
 * Searches for users with the 'lecturer' role by their email.
 * Corresponds to the GET /admin/users?search=...&role=lecturer endpoint.
 *
 * @param {string} email - The email to search for.
 * @returns {Promise<{users: Array<object>}>} A promise that resolves to an object containing an array of matching user objects.
 */
export async function searchLecturerByEmail(email) {
  if (useMock) {
    return { users: [] };
  }
  const q = new URLSearchParams();
  q.set("search", email);
  q.set("role", "lecturer");
  return apiFetch(`/admin/users?${q.toString()}`, { method: "GET" });
}
