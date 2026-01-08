import * as authApiDefault from "../api/authApi";
import { findMockUser,addMockUser  } from "../mocks/authMock"; // Import mock lookup helper

// Supported roles in the UI. // Keep this in one place
export const AUTH_ROLES = ["student", "supervisor", "lecturer", "admin", "floor_supervisor"]; // Added student

// Default role for initial state. // Used by LoginPage
export const DEFAULT_ROLE = "student"; // Pick student as default (change if you want)

// Normalize a role string coming from UI. // Prevents invalid role values
export function normalizeRole(role) { // Convert any input role to a supported role
  const r = String(role || "").trim().toLowerCase(); // Normalize string and case
  return AUTH_ROLES.includes(r) ? r : DEFAULT_ROLE; // Return safe role
} // End normalizeRole

// src/handlers/authHandlers.js

// ...keep your existing imports and constants above... // Keep your current top part

// Define role options in one place (value + Hebrew label). // Used by UI components
export const ROLE_OPTIONS = [ // Role options array
  { value: "student", label: "סטודנט" }, // Student
  { value: "supervisor", label: "משגיח" }, // Supervisor
  { value: "floor_supervisor", label: "משגיח קומה" },
  { value: "lecturer", label: "מרצה" }, // Lecturer
  { value: "admin", label: "מנהל מערכת" }, // Admin
]; // End role options

export function persistAuthToken(token, rememberMe) {
  if (rememberMe) {
    localStorage.setItem("token", token);
  } else {
    sessionStorage.setItem("token", token);
  }
}

// Single validator for login/register. // Avoid duplicate validation functions
export function validateAuthPayload(payload, requireName) { // Validate inputs with optional name requirement
  const errors = {}; // Create errors object
  const username = String(payload?.username || "").trim(); // Normalize username
  const password = String(payload?.password || "").trim(); // Normalize password
  const role = normalizeRole(payload?.role); // Normalize role
  const name = String(payload?.name || "").trim(); // Normalize name

  if (!username) errors.username = "Username is required"; // Require username
  if (!password) errors.password = "Password is required"; // Require password
  if (requireName && !name) errors.name = "Name is required"; // Require name only when asked

  return { // Return normalized result
    ok: Object.keys(errors).length === 0, // True if no errors
    errors, // Field errors
    value: { username, password, role, name }, // Normalized payload
  }; // End return
} // End validateAuthPayload

// Update loginWithApi to use validateAuthPayload. // Removes validateLoginPayload duplication
export async function loginWithApi({ username, password, role, rememberMe }, deps) { // Backend-driven login
  const { ok, errors, value } = validateAuthPayload( // Validate using shared validator
    { username, password, role }, // Payload
    false // requireName = false for login
  ); // End validate
  if (!ok) return { ok: false, errors }; // Return validation errors

  const authApi = deps?.authApi || authApiDefault; // Use injected api or default REST module
  const envMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true"; // Read env flag
  const useMock = Boolean(deps?.useMock) || envMock; // Decide whether to use mock
  const mockDelayMs = Number(deps?.mockDelayMs ?? 250); // Optional mock delay

  if (useMock) { // If mock enabled
    return mockLogin(value, { delayMs: mockDelayMs }); // Return mock result
  } // End mock path

  const result = await authApi.login({ username: value.username, password: value.password, role: value.role }); // Call REST login
  //persistAuthToken(result?.token, Boolean(rememberMe)); // Persist token if present
  return { ok: true, data: result }; // Return success
} // End loginWithApi
export async function registerWithApi({ name, username, password, role }, deps) { // Register handler
  const { ok, errors, value } = validateAuthPayload( // Use the shared validator
    { name, username, password, role }, // Payload
    true // requireName = true for register
  ); // End validate
  if (!ok) return { ok: false, errors }; // Return validation errors

  const authApi = deps?.authApi || authApiDefault; // Default to REST module
  const envMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true"; // Env flag
  const useMock = Boolean(deps?.useMock) || envMock; // Decide mock usage
  const mockDelayMs = Number(deps?.mockDelayMs ?? 250); // Delay

  if (useMock) { // Mock path
    await new Promise((resolve) => setTimeout(resolve, mockDelayMs)); // Delay
    const res = addMockUser(value); // Add user to mock list
    if (!res.ok) return { ok: false, apiError: { message: res.message } }; // Return mock error
    return { ok: true, data: { user: res.user } }; // Success (no token needed yet)
  } // End mock path

  if (!authApi?.register) { // Guard until backend exists
    throw new Error("authApi.register is missing (backend not connected yet)"); // Fail fast
  } // End guard

  const result = await authApi.register(value); // Call REST register when ready
  return { ok: true, data: result }; // Return backend result
} // End registerWithApi 

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