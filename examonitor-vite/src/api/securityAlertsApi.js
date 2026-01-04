// src/api/securityAlertsApi.js

import { apiFetch } from "./http"; // Import REST helper
import { listMockSecurityAlerts, resolveMockSecurityAlert } from "../mocks/securityAlertsMock"; // Import mock helpers

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true"; // Same flag as auth

// Assumption (REST): GET /admin/security/alerts -> { alerts: [...] } // Adjust later if backend differs
export async function listSecurityAlerts({ token, severity, status } = {}) { // Fetch security alerts
  if (useMock) { // Mock path
    return { alerts: listMockSecurityAlerts() }; // Mock response
  } // End mock

  const q = new URLSearchParams(); // Build query
  if (severity) q.set("severity", severity); // Optional severity
  if (status) q.set("status", status); // Optional status
  const suffix = q.toString() ? `?${q.toString()}` : ""; // Query suffix

  return apiFetch(`/admin/security/alerts${suffix}`, { method: "GET", token }); // REST call
} // End listSecurityAlerts

// Assumption (REST): POST /admin/security/alerts/:id/resolve -> { alert: {...} } // Adjust later if backend differs
export async function resolveSecurityAlert(alertId, token) { // Resolve one alert
  if (useMock) { // Mock path
    const res = resolveMockSecurityAlert(alertId); // Resolve in memory
    if (!res.ok) throw new Error(res.message); // Throw if failed
    return { alert: res.alert }; // Mock response
  } // End mock

  return apiFetch(`/admin/security/alerts/${encodeURIComponent(alertId)}/resolve`, { // REST call
    method: "POST", // POST
    body: {}, // Empty JSON body
    token, // Auth token
  }); // End apiFetch
} // End resolveSecurityAlert
