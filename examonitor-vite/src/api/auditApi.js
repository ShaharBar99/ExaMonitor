// src/api/auditApi.js

import { apiFetch } from "./http"; // Import REST helper
import { listMockAuditEvents } from "../mocks/auditTrailMock"; // Import mock provider

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true"; // Same flag as auth

// Assumption (REST): GET /admin/audit -> { events: [...] } // Adjust later if backend differs
export async function listAuditEvents({ token, search } = {}) { // Fetch audit events
  if (useMock) { // Mock path
    return { events: listMockAuditEvents() }; // Mock response
  } // End mock

  const q = new URLSearchParams(); // Build query
  if (search) q.set("q", search); // Optional search
  const suffix = q.toString() ? `?${q.toString()}` : ""; // Query suffix

  return apiFetch(`/admin/audit${suffix}`, { method: "GET", token }); // REST call
} // End listAuditEvents
