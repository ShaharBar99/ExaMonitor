// src/api/authApi.js

import { apiFetch } from "./http"; // Import REST helper

// POST /auth/login. // Logs in and returns backend response (e.g., { token, user })
export async function login(payload) { // Login request
  return apiFetch("/auth/login", { // Call REST endpoint
    method: "POST", // POST
    body: payload, // JSON body: { username, password, role }
  }); // Return backend response
} // End login

// GET /auth/me. // Returns current user (requires token)
export async function me(token) { // Fetch current session user
  return apiFetch("/auth/me", { // Call REST endpoint
    method: "GET", // GET
    token, // Attach token
  }); // Return backend response
} // End me

// POST /auth/refresh. // Refreshes the token
export async function refresh(payload) { // Refresh request
  return apiFetch("/auth/refresh", { // Call REST endpoint
    method: "POST", // POST
    body: payload, // JSON body: { refreshToken }
  }); // Return backend response
} // End refresh

// POST /auth/logout. // Optional backend logout
export async function logout(token) { // Logout request
  return apiFetch("/auth/logout", { // Call REST endpoint
    method: "POST", // POST
    body: {}, // Empty JSON body (safe default)
    token, // Attach token if required by backend
  }); // Return backend response
} // End logout

// POST /auth/register. // Registers a new user
export async function register(payload) { // Register request
    return apiFetch("/auth/register", { // Call REST endpoint
        method: "POST", // POST
        body: payload, // JSON body: { name, username, password, role }
    }); // Return backend response
} // End register
