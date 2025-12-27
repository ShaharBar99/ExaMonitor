// src/mocks/authMock.js

// Export a small list of mock users. // Used for local login testing
export const mockUsers = [ // Start mock users array
  { username: "student1", password: "1234", role: "student", name: "Student One" }, // Student user
  { username: "invigilator1", password: "1234", role: "invigilator", name: "Invigilator One" }, // Invigilator user
  { username: "lecturer1", password: "1234", role: "lecturer", name: "Lecturer One" }, // Lecturer user
  { username: "admin1", password: "admin123", role: "admin", name: "Admin One" }, // Admin user
]; // End mock users array

// Find a user by username + role. // Keeps lookup logic in one place
export function findMockUser(username, role) { // Export lookup function
  const u = String(username || "").trim().toLowerCase(); // Normalize username
  const r = String(role || "").trim().toLowerCase(); // Normalize role
  return mockUsers.find((x) => x.username.toLowerCase() === u && x.role.toLowerCase() === r) || null; // Return match or null
} // End findMockUser
