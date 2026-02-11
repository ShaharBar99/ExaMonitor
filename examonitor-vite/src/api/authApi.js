// src/api/authApi.js

import { apiFetch } from "./http"; // Import REST helper

/**
 * Authenticates a user with the server.
 * Corresponds to POST /auth/login.
 *
 * @param {object} payload - The login credentials.
 * @param {string} payload.username - The username.
 * @param {string} payload.password - The password.
 * @param {string} payload.role - The requested role.
 * @returns {Promise<object>} The server response containing the token and user info.
 */
export async function login(payload) { // Login request
  return apiFetch("/auth/login", { // Call REST endpoint
    method: "POST", // POST
    body: payload, // JSON body: { username, password, role }
  }); // Return backend response
} // End login

/**
 * Fetches the current authenticated user's profile.
 * Corresponds to GET /auth/me.
 *
 * @param {string} token - The authentication token.
 * @returns {Promise<object>} The user profile data.
 */
export async function me(token) { // Fetch current session user
  return apiFetch("/auth/me", { // Call REST endpoint
    method: "GET", // GET
    token, // Attach token
  }); // Return backend response
} // End me

/**
 * Refreshes the authentication token.
 * Corresponds to POST /auth/refresh.
 *
 * @param {object} payload - The payload containing the refresh token.
 * @param {string} payload.refreshToken - The refresh token.
 * @returns {Promise<object>} The new tokens.
 */
export async function refresh(payload) { // Refresh request
  return apiFetch("/auth/refresh", { // Call REST endpoint
    method: "POST", // POST
    body: payload, // JSON body: { refreshToken }
  }); // Return backend response
} // End refresh

/**
 * Logs out the user.
 * Corresponds to POST /auth/logout.
 *
 * @param {string} token - The authentication token.
 * @returns {Promise<object>} The server response.
 */
export async function logout(token) { // Logout request
  return apiFetch("/auth/logout", { // Call REST endpoint
    method: "POST", // POST
    body: {}, // Empty JSON body (safe default)
    token, // Attach token if required by backend
  }); // Return backend response
} // End logout

/**
 * Registers a new user.
 * Corresponds to POST /auth/register.
 *
 * @param {object} payload - The registration data.
 * @param {string} payload.name - The user's full name.
 * @param {string} payload.username - The username.
 * @param {string} payload.password - The password.
 * @param {string} payload.role - The user's role.
 * @returns {Promise<object>} The server response.
 */
export async function register(payload) { // Register request
    return apiFetch("/auth/register", { // Call REST endpoint
        method: "POST", // POST
        body: payload, // JSON body: { name, username, password, role }
    }); // Return backend response
} // End register
