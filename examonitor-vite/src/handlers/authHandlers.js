
import * as authApiDefault from "../api/authApi";
import { findMockUser } from "../mocks/authMock"; // Import mock lookup helper

// Supported roles in the UI. // Keep this in one place
export const AUTH_ROLES = ["student", "invigilator", "lecturer", "admin"]; // Added student

// Default role for initial state. // Used by LoginPage
export const DEFAULT_ROLE = "student"; // Pick student as default (change if you want)

// Normalize a role string coming from UI. // Prevents invalid role values
export function normalizeRole(role) { // Convert any input role to a supported role
  const r = String(role || "").trim().toLowerCase(); // Normalize string and case
  return AUTH_ROLES.includes(r) ? r : DEFAULT_ROLE; // Return safe role
} // End normalizeRole

// Validate the login payload before calling the API. // Very light validation
export function validateLoginPayload({ username, password, role }) { // Validate inputs
  const errors = {}; // Collect field errors
  const u = String(username || "").trim(); // Normalize username
  const p = String(password || "").trim(); // Normalize password
  const safeRole = normalizeRole(role); // Normalize role

  if (!u) errors.username = "Username is required"; // Require username
  if (!p) errors.password = "Password is required"; // Require password

  return { // Return validation result
    ok: Object.keys(errors).length === 0, // True if no errors
    errors, // Errors object for UI
    value: { username: u, password: p, role: safeRole }, // Normalized payload
  }; // End return
} // End validateLoginPayload

export async function loginWithApi({ username, password, role, rememberMe }, deps) { // Backend-driven login
  const { ok, errors, value } = validateLoginPayload({ username, password, role }); // Validate payload
  if (!ok) return { ok: false, errors }; // Return validation errors

  const authApi = deps?.authApi || authApiDefault; // Use injected api or default REST module

  // Optional: allow mock via deps or env var. // Vite env example: VITE_USE_AUTH_MOCK=true
  const envMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true"; // Read env flag
  const useMock = Boolean(deps?.useMock) || envMock; // Decide whether to use mock
  const mockDelayMs = Number(deps?.mockDelayMs ?? 250); // Optional mock delay

  if (useMock) { // If mock enabled
    return mockLogin(value, { delayMs: mockDelayMs }); // Return mock result
  } // End mock path

  // Call real REST API. // Backend returns token/user/etc
  const result = await authApi.login(value); // POST /auth/login

  // Optional: persist token if backend returns it. // Uses rememberMe to choose storage
  persistAuthToken(result?.token, Boolean(rememberMe)); // Save token if present

  return { ok: true, data: result }; // Return success
} // End loginWithApi

// Save token (if provided) into storage. // rememberMe chooses localStorage vs sessionStorage
function persistAuthToken(token, rememberMe) { // Persist token helper
  if (!token) return; // Do nothing if token missing
  const store = rememberMe ? localStorage : sessionStorage; // Choose storage
  store.setItem("auth_token", String(token)); // Save token under stable key
} // End persistAuthToken

// Simple mock login (temporary): checks username/password/role against mockUsers. // Replace later
export async function mockLogin({ username, password, role }, options) { // Mock backend login
  const delayMs = Number(options?.delayMs ?? 250); // Delay for realism
  await new Promise((resolve) => setTimeout(resolve, delayMs)); // Wait delay

  const u = String(username || "").trim(); // Normalize username
  const p = String(password || "").trim(); // Normalize password
  const r = String(role || "").trim().toLowerCase(); // Normalize role

  const user = findMockUser(u, r); // Find matching user by username+role
  if (!user) { // If user not found
    return { ok: false, apiError: { message: "User not found for selected role" } }; // Return mock API error
  } // End not found

  if (user.password !== p) { // If password does not match
    return { ok: false, apiError: { message: "Invalid password" } }; // Return mock API error
  } // End bad password

  return { // Return success wrapper
    ok: true, // Mock success
    data: { // Mock backend-like data
      token: "mock-token", // Fake token
      user: { username: user.username, role: user.role, name: user.name }, // User payload
    }, // End data
  }; // End return
} // End mockLogin
