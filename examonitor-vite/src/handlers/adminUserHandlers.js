
import * as usersApiDefault from "../api/usersApi"; // Default REST api module
import { normalizeRole } from "./authHandlers"; // Reuse role normalization
import { normalizeStatus } from "../mocks/adminUsersMock"; // Reuse status normalization (later can move to shared)

// Pure filter function for the UI table. // No API calls here
export function filterUsers(users, filters = {}) { // Filter users by search/role/status
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

// Fetch users (REST or mock) via usersApi. // Thin handler
export async function fetchUsers(filters = {}, deps = {}) { // Get users list
  const usersApi = deps.usersApi || usersApiDefault; // Use injected or default
  const data = await usersApi.listUsers({ ...filters }); // Call api
  const users = data?.users || []; // Extract users array
  console.log('fetchUsers: retrieved', users, 'users'); // Debug log
  return { ok: true, data: { users } }; // Return standard shape
} // End fetchUsers

// Update user status via API. // Thin handler
export async function changeUserStatus(userId, status, deps = {}) { // Change status
  const usersApi = deps.usersApi || usersApiDefault; // API module
  const safeStatus = normalizeStatus(status); // Normalize
  const data = await usersApi.setUserStatus(String(userId), safeStatus); // Call api
  return { ok: true, data }; // Return updated user
} // End changeUserStatus

// Update user role via API. // Thin handler
export async function changeUserRole(userId, role, deps = {}) { // Change role
  const usersApi = deps.usersApi || usersApiDefault; // API module
  const safeRole = normalizeRole(role); // Normalize
  const data = await usersApi.setUserRole(String(userId), safeRole); // Call api
  return { ok: true, data }; // Return updated user
} // End changeUserRole

// Update user permissions via API. // Thin handler
export async function changeUserPermissions(userId, permissions, deps = {}) { // Change permissions
  const usersApi = deps.usersApi || usersApiDefault; // API module
  const perms = Array.isArray(permissions) ? permissions : []; // Normalize perms
  const data = await usersApi.updateUserPermissions(String(userId), perms); // Call api
  return { ok: true, data }; // Return updated user
} // End changeUserPermissions

export async function createNewUser(userData, deps = {}) {
  const usersApi = deps.usersApi || usersApiDefault;
  const data = await usersApi.createUser(userData);
  return { ok: true, data };
}

export async function updateUser(userId, userData, deps = {}) {
  const usersApi = deps.usersApi || usersApiDefault;
  // Assumes usersApi has an 'updateUser' method that calls PATCH /admin/users/:id
  const data = await usersApi.updateUser(String(userId), userData);
  return { ok: true, data };
}

export async function deleteUser(userId, deps = {}) {
  const usersApi = deps.usersApi || usersApiDefault;
  const data = await usersApi.deleteUser(String(userId));
  return { ok: true, data };
}

export async function importUsers(formData, deps = {}) {
  const usersApi = deps.usersApi || usersApiDefault;
  const data = await usersApi.bulkCreateUsers(formData);
  return { ok: true, data };
}
