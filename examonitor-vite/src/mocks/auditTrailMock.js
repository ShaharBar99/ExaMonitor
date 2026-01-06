
// In-memory mock audit events. // Used when VITE_USE_AUTH_MOCK=true
const auditEvents = [ // Array of audit events
  { id: "a1", ts: "2025-12-27T09:10:00Z", actor: "admin1", action: "USER_ROLE_CHANGED", target: "student1", meta: { from: "student", to: "invigilator" }, ip: "127.0.0.1" }, // Event 1
  { id: "a2", ts: "2025-12-27T09:12:00Z", actor: "admin1", action: "USER_STATUS_CHANGED", target: "student2", meta: { from: "active", to: "inactive" }, ip: "127.0.0.1" }, // Event 2
  { id: "a3", ts: "2025-12-27T09:14:00Z", actor: "admin1", action: "PERMISSIONS_UPDATED", target: "lecturer1", meta: { added: ["EXAMS_WRITE"], removed: [] }, ip: "127.0.0.1" }, // Event 3
]; // End events

export function listMockAuditEvents() { // Return all audit events
  return [...auditEvents]; // Return copy for immutability
} // End listMockAuditEvents
