// src/api/http.js

// Read API base URL from Vite env. // Vite exposes env vars via import.meta.env
const API_BASE = import.meta.env.VITE_API_BASE || ""; // Example: "http://localhost:5000"

// Custom error type for API failures. // Lets UI/handlers handle status/messages cleanly
export class ApiError extends Error { // ApiError extends Error
  constructor(message, status, details) { // Create error with extra fields
    super(message); // Call parent Error constructor
    this.name = "ApiError"; // Set error name
    this.status = status; // HTTP status code
    this.details = details; // Optional backend error body
  } // End constructor
} // End ApiError

// Core fetch wrapper for JSON REST calls. // Handles headers, JSON parse, errors
export async function apiFetch(path, options = {}) { // Main REST function
  const method = options.method || "GET"; // Default method is GET
  const body = options.body ?? null; // Default body is null
  const token = localStorage.getItem("token") ?? null; // Optional token (caller can pass)
  const signal = options.signal; // Optional AbortController signal

  const headers = new Headers(); // Create headers object
  headers.set("Accept", "application/json"); // Expect JSON responses
  if (body !== null) headers.set("Content-Type", "application/json"); // Send JSON when body exists
  if (token) headers.set("Authorization", `Bearer ${token}`); // Attach Bearer token when available


  const url = `${API_BASE}${path}`; // Build full URL from base + path

  const res = await fetch(url, { // Perform HTTP request
    method, // HTTP method
    headers, // Headers
    body: body !== null ? JSON.stringify(body) : undefined, // Serialize JSON body only if needed
    signal, // Optional cancel signal
    credentials: "include", // Include cookies if backend uses them
  }); // End fetch

  // Handle "no content" responses. // 204 means success with empty body
  if (res.status === 204) return null; // Return null for no-content success

  // Try to parse JSON if present. // Avoid crashing on empty body
  const text = await res.text(); // Read raw response text
  const data = text ? safeJsonParse(text) : null; // Parse JSON if possible
  //console.log('apiFetch:', { url, method, status: res.status, data }); // Debug log

  if (!res.ok) { // If HTTP status is not 2xx

    const message = (data && (data.message || data.error)) || res.statusText || "Request failed"; // Pick best message
    throw new ApiError(message, res.status, data); // Throw typed error with details
  } // End error case
  if (data?.token!==undefined)
    localStorage.setItem('token', data?.token); // Store token in local storage

  return data; // Return parsed JSON data
} // End apiFetch

// Safe JSON parser helper. // Returns plain text payload if JSON parsing fails
function safeJsonParse(text) { // Parse JSON safely
  try { // Try JSON parse
    return JSON.parse(text); // Return parsed object
  } catch { // If parsing fails
    return { raw: text }; // Return raw text wrapped for debugging
  } // End try/catch
} // End safeJsonParse
