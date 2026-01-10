import React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";


import SelectExamPage from "../components/exam/SelectExamPage";
import SupervisorDashboardPage from "../components/supervisor/SupervisorDashboardPage";
import FloorSupervisorDashboardPage from "../components/floorsupervisor/FloorSupervisorDashboardPage";
import ViewClassroomsPage from "../components/classroom/ViewClassroomsPage";
import LecturerDashboardPage from "../components/lecturer/LecturerDashboardPage";
import StudentPage from "../components/student/StudentPage";
import IncidentReportPage from "../components/supervisor/IncidentReportPage";

import LoginPage from "../components/auth/authPages/LoginPage"; // Login route page
import RegisterPage from "../components/auth/authPages/RegisterPage"; // Register route page
import AdminLayout from "../components/admin/adminComponents/AdminLayout"; // Admin layout wrapper
import ManageUsersPage from "../components/admin/adminPages/ManageUsersPage"; // Admin route page
import AuditTrailPage from "../components/admin/adminPages/AuditTrailPage"; // Admin route page
import SecurityAlertsPage from "../components/admin/adminPages/SecurityAlertsPage"; // Admin route page

export default function AppRoutes() { // Export a component that holds the route table
  const navigate = useNavigate(); // Router navigation
  return ( // Return the routing tree
    <Routes> {/* Route switch (React Router v6) */}
      <Route path="/login" element={<LoginPage />} /> {/* Login screen */}
      <Route path="/register" element={<RegisterPage />} /> {/* Register screen */}

      <Route path="/admin" element={<AdminLayout />}> {/* Admin area wrapper */}
        <Route index element={<Navigate to="/admin/users" replace />} /> {/* Default admin route */}
        <Route path="users" element={<ManageUsersPage />} /> {/* Admin users */}
        <Route path="audit" element={<AuditTrailPage />} /> {/* Admin audit trail */}
        <Route path="security" element={<SecurityAlertsPage />} /> {/* Admin security alerts */}
      </Route> {/* End admin wrapper */}

      <Route path="/" element={<Navigate to="/login" replace />} /> {/* Default route */}
      <Route path="*" element={<Navigate to="/login" replace />} /> {/* Fallback route */}
      <Route path="/select-exam" element={<SelectExamPage navigate={navigate} />} />
      {/* דף המבחן עצמו (אחרי שבוחרים) */}
      <Route path="/exam/active/:examId" element={<SupervisorDashboardPage />} />
      <Route path="/supervisor/floorsupervisorDashboardPage" element={<FloorSupervisorDashboardPage />} />
      <Route path="/Lecturer/lecturerDashboardPage" element={<LecturerDashboardPage />} />
      <Route path="/student/page" element={<StudentPage />} />
      <Route path="/exam/view-classrooms" element={<ViewClassroomsPage />} />
      <Route path="/exam/incident-report/:examId" element={<IncidentReportPage />} />
    </Routes> // End of routes
  ); // End return
} // End component
