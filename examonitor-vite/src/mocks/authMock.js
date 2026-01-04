// src/mocks/authMock.js

// Export a small list of mock users. // Used for local login testing
export const mockUsers = [ // Start mock users array
  { username: "student1", password: "1234", role: "student", name: "Student One" }, // Student user
  { username: "invigilator1", password: "1234", role: "invigilator", name: "Invigilator One" }, // Invigilator user
  { username: "lecturer1", password: "1234", role: "lecturer", name: "Lecturer One" }, // Lecturer user
  { username: "admin1", password: "admin123", role: "admin", name: "Admin One" }, // Admin user
  { username: "floorsupervisor1", password: "1234", role: "floorsupervisor", name: "floorinvesgator1" }, // Admin user
]; // End mock users array

// Find a user by username + role. // Keeps lookup logic in one place
export function findMockUser(username, role) { // Export lookup function
  const u = String(username || "").trim().toLowerCase(); // Normalize username
  const r = String(role || "").trim().toLowerCase(); // Normalize role
  return mockUsers.find((x) => x.username.toLowerCase() === u && x.role.toLowerCase() === r) || null; // Return match or null
} // End findMockUser

// Add a new mock user if username+role is not taken. // Register helper
export function addMockUser({ username, password, role, name }) { // Export register helper
  const u = String(username || "").trim().toLowerCase(); // Normalize username
  const r = String(role || "").trim().toLowerCase(); // Normalize role
  const p = String(password || "").trim(); // Normalize password
  const n = String(name || "").trim(); // Normalize name

  if (!u) return { ok: false, message: "Username is required" }; // Require username
  if (!p) return { ok: false, message: "Password is required" }; // Require password
  if (!r) return { ok: false, message: "Role is required" }; // Require role

  const exists = mockUsers.some((x) => x.username.toLowerCase() === u && x.role.toLowerCase() === r); // Check duplicates
  if (exists) return { ok: false, message: "User already exists for this role" }; // Duplicate error

  mockUsers.push({ username: u, password: p, role: r, name: n || u }); // Add new user to mock list
  return { ok: true, user: { username: u, role: r, name: n || u } }; // Return created user
} // End addMockUser

