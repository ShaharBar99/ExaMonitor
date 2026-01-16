// src/handlers/securityAlertsHandlers.js

import * as securityApiDefault from "../api/securityAlertsApi"; // Import default API module

export function filterSecurityAlerts(alerts, { status } = {}) { // Pure filter helper
  const list = Array.isArray(alerts) ? alerts : []; // Ensure array
  const st = String(status || "").trim().toLowerCase(); // Normalize status

  return list.filter((a) => { // Filter predicate
    const aSt = String(a?.status || "").toLowerCase(); // Alert status
    return !st || aSt === st; // Match or no filter
  }); // End filter
} // End filterSecurityAlerts

export async function fetchSecurityAlerts({ status } = {}, deps = {}) { // Fetch helper
  const securityApi = deps.securityApi || securityApiDefault; // Use injected or default
  const token = deps.token; // Optional token
  const data = await securityApi.listSecurityAlerts({ token, status }); // Call API
  const alerts = data?.alerts || []; // Extract alerts
  return { ok: true, data: { alerts } }; // Standard response
} // End fetchSecurityAlerts

export async function resolveAlert(alertId, deps = {}) { // Resolve helper
  const securityApi = deps.securityApi || securityApiDefault; // API module
  const token = deps.token; // Optional token
  const data = await securityApi.resolveSecurityAlert(String(alertId), token); // Call API
  return { ok: true, data }; // Standard response
} // End resolveAlert
