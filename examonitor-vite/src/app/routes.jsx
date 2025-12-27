// src/app/routes.jsx

import React from "react"; // React import (needed for JSX in some setups)
import { Navigate, Route, Routes } from "react-router-dom"; // Router components

import LoginPage from "../pages/auth/LoginPage"; // Login route page
import RegisterPage from "../pages/auth/RegisterPage"; // Register route page
import ActiveExamConsolePage from "../pages/exam/ActiveExamConsolePage"; // Exam route page

import AdminLayout from "../components/admin/AdminLayout"; // Admin layout wrapper
import ManageUsersPage from "../pages/admin/ManageUsersPage"; // Admin route page
import AuditTrailPage from "../pages/admin/AuditTrailPage"; // Admin route page
import SecurityAlertsPage from "../pages/admin/SecurityAlertsPage"; // Admin route page

export default function AppRoutes() { // Export a component that holds the route table
  return ( // Return the routing tree
    <Routes> {/* Route switch (React Router v6) */}
      <Route path="/login" element={<LoginPage />} /> {/* Login screen */}
      <Route path="/register" element={<RegisterPage />} /> {/* Register screen */}
      <Route path="/exam/active" element={<ActiveExamConsolePage />} /> {/* Exam console */}

      <Route path="/admin" element={<AdminLayout />}> {/* Admin area wrapper */}
        <Route index element={<Navigate to="/admin/users" replace />} /> {/* Default admin route */}
        <Route path="users" element={<ManageUsersPage />} /> {/* Admin users */}
        <Route path="audit" element={<AuditTrailPage />} /> {/* Admin audit trail */}
        <Route path="security" element={<SecurityAlertsPage />} /> {/* Admin security alerts */}
      </Route> {/* End admin wrapper */}

      <Route path="/" element={<Navigate to="/login" replace />} /> {/* Default route */}
      <Route path="*" element={<Navigate to="/login" replace />} /> {/* Fallback route */}
    </Routes> // End of routes
  ); // End return
} // End component
