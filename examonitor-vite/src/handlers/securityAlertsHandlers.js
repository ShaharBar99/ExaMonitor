// src/handlers/securityAlertsHandlers.js

import * as securityApiDefault from "../api/securityAlertsApi"; // Import default API module

export function filterSecurityAlerts(alerts, { severity, status } = {}) { // Pure filter helper
  const list = Array.isArray(alerts) ? alerts : []; // Ensure array
  const sev = String(severity || "").trim().toLowerCase(); // Normalize severity
  const st = String(status || "").trim().toLowerCase(); // Normalize status

  return list.filter((a) => { // Filter predicate
    const aSev = String(a?.severity || "").toLowerCase(); // Alert severity
    const aSt = String(a?.status || "").toLowerCase(); // Alert status
    const matchSev = !sev || aSev === sev; // Severity match
    const matchSt = !st || aSt === st; // Status match
    return matchSev && matchSt; // Combined
  }); // End filter
} // End filterSecurityAlerts

export async function fetchSecurityAlerts({ severity, status } = {}, deps = {}) { // Fetch helper
  const securityApi = deps.securityApi || securityApiDefault; // Use injected or default
  const token = deps.token; // Optional token
  const data = await securityApi.listSecurityAlerts({ token, severity, status }); // Call API
  const alerts = data?.alerts || []; // Extract alerts
  return { ok: true, data: { alerts } }; // Standard response
} // End fetchSecurityAlerts

export async function resolveAlert(alertId, deps = {}) { // Resolve helper
  const securityApi = deps.securityApi || securityApiDefault; // API module
  const token = deps.token; // Optional token
  const data = await securityApi.resolveSecurityAlert(String(alertId), token); // Call API
  return { ok: true, data }; // Standard response
} // End resolveAlert
