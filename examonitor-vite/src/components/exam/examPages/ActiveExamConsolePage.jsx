// src/pages/exam/ActiveExamConsolePage.jsx
import React from "react"; // React import
import { useNavigate } from "react-router-dom"; // Navigation hook

export default function ActiveExamConsolePage() { // Exam console placeholder
  const navigate = useNavigate(); // Create navigation function

  return ( // Return UI
    <div style={{ padding: 16 }}> {/* Simple layout */}
      <h1>Active Exam Console</h1> {/* Title */}
      <p>Placeholder page (Step 1 routing test).</p> {/* Description */}
      <button type="button" onClick={() => navigate("/login")}>Back to Login</button> {/* Back */}
    </div> // End container
  ); // End return
} // End component
