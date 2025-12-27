import React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import ManageUsersPage from "../pages/admin/ManageUsersPage";
import SelectExamPage from "../pages/exam/SelectExamPage";
import SupervisorDashboardPage from "../pages/supervisor/SupervisorDashboardPage";
import FloorSupervisorDashboardPage from "../pages/supervisor/FloorSupervisorDashboardPage";
import ViewClassroomsPage from "../pages/lecturer/ViewClassroomsPage";
import LecturerDashboardPage from "../pages/lecturer/LecturerDashboardPage";
import IncidentReportPage from "../pages/exam/IncidentReportPage";

export default function AppRoutes() {
  const navigate = useNavigate();
  return (
    <Routes>
      {/*<Route path="/login" element={<LoginPage />} />*/}
      
      {/* זה הדף שאנחנו רוצים להגיע אליו */}
      <Route path="/" element={<SelectExamPage navigate={navigate} />} />
      
      {/* דף המבחן עצמו (אחרי שבוחרים) */}
      <Route path="/exam/active/:examId" element={<SupervisorDashboardPage />} />
      <Route path="/supervisor/floorsupervisorDashboardPage" element={<FloorSupervisorDashboardPage />} />
      <Route path="/Lecturer/lecturerDashboardPage" element={<LecturerDashboardPage />} />
      <Route path="/exam/view-classrooms" element={<ViewClassroomsPage />} />
      <Route path="/exam/incident-report" element={<IncidentReportPage />} />
      {/*<Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />*/}
    </Routes>
  );
}
