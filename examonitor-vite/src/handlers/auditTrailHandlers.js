// src/handlers/auditTrailHandlers.js

import * as auditApiDefault from "../api/auditApi"; // Import default API module

export function filterAuditEvents(events, { search } = {}) { // Pure filter helper
  const list = Array.isArray(events) ? events : []; // Ensure array
  const q = String(search || "").trim().toLowerCase(); // Normalize search
  if (!q) return list; // No search -> return all

  return list.filter((e) => { // Filter predicate
    const actor = String(e?.actor || "").toLowerCase(); // Normalize actor
    const action = String(e?.action || "").toLowerCase(); // Normalize action
    const target = String(e?.target || "").toLowerCase(); // Normalize target
    const msg = JSON.stringify(e?.meta || {}).toLowerCase(); // Search meta too
    return actor.includes(q) || action.includes(q) || target.includes(q) || msg.includes(q); // Match any
  }); // End filter
} // End filterAuditEvents

export async function fetchAuditEvents({ search } = {}, deps = {}) { // Fetch helper for page
  const auditApi = deps.auditApi || auditApiDefault; // Use injected or default
  const token = deps.token; // Optional token
  const data = await auditApi.listAuditEvents({ token, search }); // Call API
  const events = data?.events || []; // Extract events
  return { ok: true, data: { events } }; // Standard response
} // End fetchAuditEvents
