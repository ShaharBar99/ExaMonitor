
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
    const name = String(u?.name || "").toLowerCase(); // Normalize name
    const username = String(u?.username || "").toLowerCase(); // Normalize username
    const uRole = normalizeRole(u?.role); // Normalize role
    const uStatus = normalizeStatus(u?.status); // Normalize status

    const matchQ = !q || name.includes(q) || username.includes(q); // Search matches
    const matchRole = !role || uRole === role; // Role matches
    const matchStatus = !status || uStatus === status; // Status matches

    return matchQ && matchRole && matchStatus; // Combined match
  }); // End filter
} // End filterUsers

// Fetch users (REST or mock) via usersApi. // Thin handler
export async function fetchUsers(filters = {}, deps = {}) { // Get users list
  const usersApi = deps.usersApi || usersApiDefault; // Use injected or default
  const token = localStorage.getItem("token") ?? null; // Get token from local storage
  const data = await usersApi.listUsers({ ...filters, token }); // Call api
  const users = data?.users || []; // Extract users array
  console.log('fetchUsers: retrieved', users, 'users'); // Debug log
  return { ok: true, data: { users } }; // Return standard shape
} // End fetchUsers

// Update user status via API. // Thin handler
export async function changeUserStatus(userId, status, deps = {}) { // Change status
  const usersApi = deps.usersApi || usersApiDefault; // API module
  const token = deps.token; // Optional token
  const safeStatus = normalizeStatus(status); // Normalize
  const data = await usersApi.setUserStatus(String(userId), safeStatus, token); // Call api
  return { ok: true, data }; // Return updated user
} // End changeUserStatus

// Update user role via API. // Thin handler
export async function changeUserRole(userId, role, deps = {}) { // Change role
  const usersApi = deps.usersApi || usersApiDefault; // API module
  const token = deps.token; // Optional token
  const safeRole = normalizeRole(role); // Normalize
  const data = await usersApi.setUserRole(String(userId), safeRole, token); // Call api
  return { ok: true, data }; // Return updated user
} // End changeUserRole

// Update user permissions via API. // Thin handler
export async function changeUserPermissions(userId, permissions, deps = {}) { // Change permissions
  const usersApi = deps.usersApi || usersApiDefault; // API module
  const token = deps.token; // Optional token
  const perms = Array.isArray(permissions) ? permissions : []; // Normalize perms
  const data = await usersApi.updateUserPermissions(String(userId), perms, token); // Call api
  return { ok: true, data }; // Return updated user
} // End changeUserPermissions
