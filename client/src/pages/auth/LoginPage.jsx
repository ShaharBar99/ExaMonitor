// src/pages/auth/LoginPage.jsx
import React, { useState } from "react"; // React + state hook
import { useNavigate } from "react-router-dom"; // Navigation hook

export default function LoginPage() { // Login page component
  const navigate = useNavigate(); // Create navigation function
  const [role, setRole] = useState("invigilator"); // Track selected role
  const [username, setUsername] = useState(""); // Track username input
  const [password, setPassword] = useState(""); // Track password input

  const onSubmit = (e) => { // Handle form submit
    e.preventDefault(); // Stop page refresh
    console.log({ username, role }); // Preserve current behavior (log)
    // NOTE: navigation is just for testing routing now
    navigate("/exam/active"); // Go to exam console page
  }; // End submit handler

  return ( // Return UI
    <div style={{ padding: 16 }}> {/* Simple layout */}
      <h1>Login</h1> {/* Title */}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}> {/* Role buttons row */}
        <button type="button" onClick={() => setRole("invigilator")}>Invigilator</button> {/* Set role */}
        <button type="button" onClick={() => setRole("lecturer")}>Lecturer</button> {/* Set role */}
        <button type="button" onClick={() => setRole("admin")}>Admin</button> {/* Set role */}
      </div> {/* End role row */}

      <p>Selected role: {role}</p> {/* Show chosen role */}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 320 }}> {/* Form */}
        <input
          value={username} // Controlled value
          onChange={(e) => setUsername(e.target.value)} // Update state
          placeholder="Username" // Placeholder text
        /> {/* End input */}
        <input
          value={password} // Controlled value
          onChange={(e) => setPassword(e.target.value)} // Update state
          placeholder="Password" // Placeholder text
          type="password" // Hide input
        /> {/* End input */}
        <button type="submit">Sign in</button> {/* Submit */}
      </form> {/* End form */}

      <div style={{ marginTop: 16 }}> {/* Quick test links */}
        <button type="button" onClick={() => navigate("/admin/users")}>Go to Admin Users</button> {/* Navigate */}
      </div> {/* End links */}
    </div> // End container
  ); // End return
} // End component
