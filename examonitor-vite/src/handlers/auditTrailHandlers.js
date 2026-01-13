// src/handlers/auditTrailHandlers.js

import * as auditApiDefault from "../api/auditApi"; // Import default API module

function safeString(v) { // Convert to safe string
  if (v === null || v === undefined) return ""; // Null/undefined
  return String(v); // Convert
} // End safeString

function formatAuditTs(iso) { // Format ISO timestamp
  const s = safeString(iso); // Ensure string
  if (!s) return ""; // No value
  const d = new Date(s); // Parse
  if (Number.isNaN(d.getTime())) return s; // Fallback to raw
  return d.toLocaleString(); // Human readable
} // End formatAuditTs

function pickNote(metadata) { // Extract "note" from metadata if exists
  if (!metadata || typeof metadata !== "object") return ""; // Guard
  return safeString(metadata.note || metadata.message || metadata.reason || ""); // Common keys
} // End pickNote

export function normalizeAuditEvent(row) { // Normalize backend row -> UI event
  const meta = row?.metadata ?? row?.meta ?? {}; // Support both keys
  return { // Normalized shape
    id: row?.id, // Row id
    ts: formatAuditTs(row?.created_at ?? row?.ts), // Time
    action: safeString(row?.action), // Action
    note: pickNote(meta), // Optional note
    meta, // Keep full metadata if needed later
  }; // End return
} // End normalizeAuditEvent

export function filterAuditEvents(events, { search } = {}) { // Pure filter helper
  const list = Array.isArray(events) ? events : []; // Ensure array
  const q = safeString(search).trim().toLowerCase(); // Normalize search
  if (!q) return list; // No search -> return all

  return list.filter((e) => { // Filter predicate
    const action = safeString(e?.action).toLowerCase(); // Action
    const ts = safeString(e?.ts).toLowerCase(); // Time text
    const note = safeString(e?.note).toLowerCase(); // Note text
    const meta = JSON.stringify(e?.meta || {}).toLowerCase(); // Meta text
    return action.includes(q) || ts.includes(q) || note.includes(q) || meta.includes(q); // Match any
  }); // End filter
} // End filterAuditEvents

export async function fetchAuditEvents({ search } = {}, deps = {}) { // Fetch helper for page
  const auditApi = deps.auditApi || auditApiDefault; // Use injected or default
  const token = deps.token; // Optional token

  const data = await auditApi.listAuditEvents({ token, search }); // Call API
  const rows = data?.events || []; // Extract rows

  const events = rows.map(normalizeAuditEvent); // Normalize rows
  return { ok: true, data: { events } }; // Standard response
} // End fetchAuditEvents
