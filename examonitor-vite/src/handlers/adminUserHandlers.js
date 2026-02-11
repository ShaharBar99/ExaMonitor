/**
 * @fileoverview This file contains handler functions for administrative user management.
 * These handlers act as a middle layer between the UI components and the user API,
 * encapsulating business logic, data normalization, and dependency injection for testability.
 */

import * as usersApiDefault from "../api/usersApi"; // Default REST api module
import { normalizeRole } from "./authHandlers"; // Reuse role normalization
import { normalizeStatus } from "../mocks/adminUsersMock"; // Reuse status normalization (later can move to shared)

/**
 * A pure function to filter a list of users based on specified criteria.
 * This function does not perform any API calls and is intended for client-side filtering.
 *
 * @param {Array<object>} users - The array of user objects to filter.
 * @param {object} [filters={}] - The filter criteria.
 * @param {string} [filters.search] - A search string to match against user's full name or username.
 * @param {string} [filters.role] - The role to filter by.
 * @param {string} [filters.status] - The status to filter by ('active' or 'inactive').
 * @returns {Array<object>} The filtered array of user objects.
 */
export function filterUsers(users, filters = {}) {
  const list = Array.isArray(users) ? users : []; // Ensure array
  const q = String(filters.search || "").trim().toLowerCase(); // Normalize search query
  const role = filters.role ? normalizeRole(filters.role) : ""; // Normalize role filter
  const status = filters.status ? normalizeStatus(filters.status) : ""; // Normalize status filter

  return list.filter((u) => { // Filter predicate
    const name = String(u?.full_name || "").toLowerCase();
    const uStatus = u?.is_active ? "active" : "inactive";
    const username = String(u?.username || "").toLowerCase(); // Normalize username
    const uRole = normalizeRole(u?.role); // Normalize role

    const matchQ = !q || name.includes(q) || username.includes(q); // Search matches
    const matchRole = !role || uRole === role; // Role matches
    const matchStatus = !status || uStatus === status; // Status matches

    return matchQ && matchRole && matchStatus; // Combined match
  }); // End filter
} // End filterUsers

/**
 * Fetches a list of users, acting as a thin wrapper around the `usersApi.listUsers` method.
 * It supports dependency injection for testing purposes.
 *
 * @param {object} [filters={}] - The filter criteria to pass to the API.
 * @param {object} [deps={}] - Dependencies for injection, primarily for testing.
 * @param {object} [deps.usersApi] - An object implementing the user API methods. Defaults to `usersApiDefault`.
 * @returns {Promise<{ok: boolean, data: {users: Array<object>}}>} A promise that resolves to a standardized response object containing the list of users.
 */
export async function fetchUsers(filters = {}, deps = {}) {
  const usersApi = deps.usersApi || usersApiDefault; // Use injected or default
  const data = await usersApi.listUsers({ ...filters }); // Call api
  const users = data?.users || []; // Extract users array
  console.log('fetchUsers: retrieved', users, 'users'); // Debug log
  return { ok: true, data: { users } }; // Return standard shape
} // End fetchUsers

/**
 * Changes the status of a user via an API call.
 * Normalizes the status before sending it to the API.
 *
 * @param {string|number} userId - The ID of the user to update.
 * @param {string} status - The new status for the user.
 * @param {object} [deps={}] - Dependencies for injection.
 * @param {object} [deps.usersApi] - The user API implementation.
 * @returns {Promise<{ok: boolean, data: object}>} A promise that resolves to a standardized response object with the updated user data.
 */
export async function changeUserStatus(userId, status, deps = {}) {
  const usersApi = deps.usersApi || usersApiDefault; // API module
  const safeStatus = normalizeStatus(status); // Normalize
  const data = await usersApi.setUserStatus(String(userId), safeStatus); // Call api
  return { ok: true, data }; // Return updated user
} // End changeUserStatus

/**
 * Changes the role of a user via an API call.
 * Normalizes the role before sending it to the API.
 *
 * @param {string|number} userId - The ID of the user to update.
 * @param {string} role - The new role for the user.
 * @param {object} [deps={}] - Dependencies for injection.
 * @param {object} [deps.usersApi] - The user API implementation.
 * @returns {Promise<{ok: boolean, data: object}>} A promise that resolves to a standardized response object with the updated user data.
 */
export async function changeUserRole(userId, role, deps = {}) {
  const usersApi = deps.usersApi || usersApiDefault; // API module
  const safeRole = normalizeRole(role); // Normalize
  const data = await usersApi.setUserRole(String(userId), safeRole); // Call api
  return { ok: true, data }; // Return updated user
} // End changeUserRole

/**
 * Changes the permissions of a user via an API call.
 * Ensures the permissions are in an array format.
 *
 * @param {string|number} userId - The ID of the user to update.
 * @param {Array<string>} permissions - The new list of permissions for the user.
 * @param {object} [deps={}] - Dependencies for injection.
 * @param {object} [deps.usersApi] - The user API implementation.
 * @returns {Promise<{ok: boolean, data: object}>} A promise that resolves to a standardized response object with the updated user data.
 */
export async function changeUserPermissions(userId, permissions, deps = {}) {
  const usersApi = deps.usersApi || usersApiDefault; // API module
  const perms = Array.isArray(permissions) ? permissions : []; // Normalize perms
  const data = await usersApi.updateUserPermissions(String(userId), perms); // Call api
  return { ok: true, data }; // Return updated user
} // End changeUserPermissions

/**
 * Creates a new user by calling the user API.
 *
 * @param {object} userData - The data for the new user.
 * @param {object} [deps={}] - Dependencies for injection.
 * @param {object} [deps.usersApi] - The user API implementation.
 * @returns {Promise<{ok: boolean, data: object}>} A promise that resolves to a standardized response object with the new user's data.
 */
export async function createNewUser(userData, deps = {}) {
  const usersApi = deps.usersApi || usersApiDefault;
  const data = await usersApi.createUser(userData);
  return { ok: true, data };
}

/**
 * Updates an existing user's data by calling the user API.
 *
 * @param {string|number} userId - The ID of the user to update.
 * @param {object} userData - The new data for the user.
 * @param {object} [deps={}] - Dependencies for injection.
 * @param {object} [deps.usersApi] - The user API implementation.
 * @returns {Promise<{ok: boolean, data: object}>} A promise that resolves to a standardized response object with the updated user's data.
 */
export async function updateUser(userId, userData, deps = {}) {
  const usersApi = deps.usersApi || usersApiDefault;
  // Assumes usersApi has an 'updateUser' method that calls PATCH /admin/users/:id
  const data = await usersApi.updateUser(String(userId), userData);
  return { ok: true, data };
}

/**
 * Deletes a user by calling the user API.
 *
 * @param {string|number} userId - The ID of the user to delete.
 * @param {object} [deps={}] - Dependencies for injection.
 * @param {object} [deps.usersApi] - The user API implementation.
 * @returns {Promise<{ok: boolean, data: object}>} A promise that resolves to a standardized response object indicating the result of the deletion.
 */
export async function deleteUser(userId, deps = {}) {
  const usersApi = deps.usersApi || usersApiDefault;
  const data = await usersApi.deleteUser(String(userId));
  return { ok: true, data };
}

/**
 * Initiates a bulk user import process by calling the user API.
 *
 * @param {FormData} formData - The form data containing the file for bulk import.
 * @param {object} [deps={}] - Dependencies for injection.
 * @param {object} [deps.usersApi] - The user API implementation.
 * @returns {Promise<{ok: boolean, data: object}>} A promise that resolves to a standardized response object with the result of the import process.
 */
export async function importUsers(formData, deps = {}) {
  const usersApi = deps.usersApi || usersApiDefault;
  const data = await usersApi.bulkCreateUsers(formData);
  return { ok: true, data };
}
