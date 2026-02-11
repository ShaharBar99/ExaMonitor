/**
 * @fileoverview Handlers for authentication logic, including login, registration, and token persistence.
 */

import * as authApiDefault from "../api/authApi";
import { findMockUser,addMockUser  } from "../mocks/authMock"; // Import mock lookup helper

// Supported roles in the UI. // Keep this in one place
export const AUTH_ROLES = ["student", "supervisor", "lecturer", "admin", "floor_supervisor"]; // Added student

// Default role for initial state. // Used by LoginPage
export const DEFAULT_ROLE = "student"; // Pick student as default (change if you want)

/**
 * Normalizes a role string to ensure it matches a supported role.
 *
 * @param {string} role - The role string to normalize.
 * @returns {string} The normalized role, or the default role if invalid.
 */
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

/**
 * Persists authentication tokens to local or session storage.
 *
 * @param {string} token - The access token.
 * @param {string} refreshToken - The refresh token.
 * @param {boolean} rememberMe - Whether to persist across sessions (localStorage vs sessionStorage).
 */
export function persistAuthToken(token, refreshToken, rememberMe) {
  // Always save to localStorage for admin/supervisor features to work across navigation
  localStorage.setItem("token", token);
  localStorage.setItem("refreshToken", refreshToken);
  // Also save to sessionStorage as fallback for non-persistent sessions if rememberMe is false
  if (!rememberMe) {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("refreshToken", refreshToken);
  }
}

/**
 * Validates authentication payload for login or registration.
 *
 * @param {object} payload - The payload to validate.
 * @param {boolean} requireName - Whether the 'name' field is required (for registration).
 * @returns {{ok: boolean, errors: object, value: object}} The validation result.
 */
export function validateAuthPayload(payload, requireName) { // Validate inputs with optional name requirement
  const errors = {}; // Create errors object
  const username = String(payload?.username || "").trim(); // Normalize username
  const password = String(payload?.password || "").trim(); // Normalize password
  const email = String(payload?.email || "").trim(); // Normalize email
  const role = normalizeRole(payload?.role); // Normalize role
  const name = String(payload?.name || "").trim(); // Normalize name

  if (!username) errors.username = "Username is required"; // Require username
  if (!password) errors.password = "Password is required"; // Require password
  if (requireName && !name) errors.name = "Name is required"; // Require name only when asked

  return { // Return normalized result
    ok: Object.keys(errors).length === 0, // True if no errors
    errors, // Field errors
    value: { username, email, password, role, name }, // Normalized payload
  }; // End return
} // End validateAuthPayload

/**
 * Handles the login process via API or mock.
 *
 * @param {object} credentials - The login credentials.
 * @param {string} credentials.username - The username.
 * @param {string} credentials.password - The password.
 * @param {string} credentials.role - The requested role.
 * @param {boolean} credentials.rememberMe - Whether to remember the user.
 * @param {object} [deps] - Dependencies for injection (api, mock flags).
 * @returns {Promise<{ok: boolean, data?: object, errors?: object}>} The result of the login attempt.
 */
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
  persistAuthToken(result?.token, result?.refreshToken, Boolean(rememberMe)); // Persist token if present
  return { ok: true, data: result }; // Return success
} // End loginWithApi

/**
 * Handles the registration process via API or mock.
 *
 * @param {object} userData - The user registration data.
 * @param {string} userData.name - Full name.
 * @param {string} userData.username - Username.
 * @param {string} userData.email - Email address.
 * @param {string} userData.password - Password.
 * @param {string} userData.role - Role.
 * @param {object} [deps] - Dependencies for injection.
 * @returns {Promise<{ok: boolean, data?: object, errors?: object, apiError?: object}>} The result of the registration attempt.
 */
export async function registerWithApi({ name, username, email, password, role }, deps) { // Register handler
  const { ok, errors, value } = validateAuthPayload( // Use the shared validator
    { name, username, email, password, role }, // Payload
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

/**
 * Simulates a login process using mock data.
 *
 * @param {object} credentials - Login credentials.
 * @param {string} credentials.username - Username.
 * @param {string} credentials.password - Password.
 * @param {string} credentials.role - Role.
 * @param {object} [options] - Mock options (delay).
 * @returns {Promise<{ok: boolean, data?: object, apiError?: object}>} The mock login result.
 */
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
