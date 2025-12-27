// src/mocks/securityAlertsMock.js

// In-memory mock security alerts. // Used when VITE_USE_AUTH_MOCK=true
let alerts = [ // Alerts list
  { id: "s1", ts: "2025-12-27T09:20:00Z", severity: "high", type: "MULTIPLE_FAILED_LOGINS", message: "Multiple failed login attempts for user student1", status: "open" }, // Alert 1
  { id: "s2", ts: "2025-12-27T09:25:00Z", severity: "medium", type: "SUSPICIOUS_IP", message: "Login attempt from unusual IP address", status: "open" }, // Alert 2
  { id: "s3", ts: "2025-12-27T09:30:00Z", severity: "low", type: "PASSWORD_RESET_REQUESTS", message: "Repeated password reset requests detected", status: "resolved" }, // Alert 3
]; // End alerts list

export function listMockSecurityAlerts() { // Return all alerts
  return [...alerts]; // Return a copy
} // End listMockSecurityAlerts

export function resolveMockSecurityAlert(alertId) { // Mark an alert as resolved
  const id = String(alertId || "").trim(); // Normalize id
  const idx = alerts.findIndex((a) => a.id === id); // Find alert
  if (idx === -1) return { ok: false, message: "Alert not found" }; // Not found
  alerts[idx] = { ...alerts[idx], status: "resolved" }; // Set status to resolved
  return { ok: true, alert: alerts[idx] }; // Return updated alert
} // End resolveMockSecurityAlert
