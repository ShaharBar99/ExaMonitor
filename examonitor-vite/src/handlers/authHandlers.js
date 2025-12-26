// src/handlers/authHandlers.js

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

// Main login handler: call backend auth API and return its result. // No UI state changes here
export async function loginWithApi({ username, password, role }, deps) { // Backend-driven login
  const { ok, errors, value } = validateLoginPayload({ username, password, role }); // Validate payload
  if (!ok) return { ok: false, errors }; // Return validation errors

  const authApi = deps?.authApi; // Injected API module (preferred)
  const useMock = Boolean(deps?.useMock); // Optional flag to force mock
  const mockDelayMs = Number(deps?.mockDelayMs ?? 250); // Optional mock delay

  if (useMock) { // If caller wants a mock response
    return mockLogin(value, { delayMs: mockDelayMs }); // Return mock result
  } // End mock path

  if (!authApi?.login) { // Ensure API function exists
    throw new Error("authApi.login is missing. Inject it via deps: { authApi }"); // Fail fast
  } // End guard

  // Expected: authApi.login({ username, password, role }) -> backend response // Keep flexible
  const result = await authApi.login(value); // Call backend API

  // Return a consistent wrapper. // UI can decide what to do with it
  return { ok: true, data: result }; // Success response
} // End loginWithApi

// Simple mock login (temporary): simulates backend response shape. // Replace later
export async function mockLogin({ username, role }, options) { // Mock backend login
  const delayMs = Number(options?.delayMs ?? 250); // Delay for realism
  await new Promise((resolve) => setTimeout(resolve, delayMs)); // Wait delay

  // Mock response shape (assumption): { token, user } // Adjust to your backend later
  return { // Return mock wrapper
    ok: true, // Mock success
    data: { // Mock data
      token: "mock-token", // Fake token
      user: { username, role }, // Minimal user payload
    }, // End data
  }; // End return
} // End mockLogin
