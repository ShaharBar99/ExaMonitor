import React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import LoginPage from "../components/auth/LoginPage";
import ManageUsersPage from "../components/admin/ManageUsersPage";
import SelectExamPage from "../components/exam/SelectExamPage";
import SupervisorDashboardPage from "../components/supervisor/SupervisorDashboardPage";
import FloorSupervisorDashboardPage from "../components/supervisor/FloorSupervisorDashboardPage";
import ViewClassroomsPage from "../components/lecturer/ViewClassroomsPage";
import LecturerDashboardPage from "../components/lecturer/LecturerDashboardPage";
import IncidentReportPage from "../components/exam/IncidentReportPage";

export default function AppRoutes() {
  const navigate = useNavigate();
  return (
    <Routes>
      {/*<Route path="/login" element={<LoginPage />} />*/}
      
      {/* זה הדף שאנחנו רוצים להגיע אליו */}
      <Route path="/" element={<SelectExamPage navigate={navigate} />} />
      <Route path="/select-exam" element={<SelectExamPage navigate={navigate} />} />
      {/* דף המבחן עצמו (אחרי שבוחרים) */}
      <Route path="/exam/active/:examId" element={<SupervisorDashboardPage />} />
      <Route path="/supervisor/floorsupervisorDashboardPage" element={<FloorSupervisorDashboardPage />} />
      <Route path="/Lecturer/lecturerDashboardPage" element={<LecturerDashboardPage />} />
      <Route path="/exam/view-classrooms" element={<ViewClassroomsPage />} />
      <Route path="/exam/incident-report/:examId" element={<IncidentReportPage />} />
      {/*<Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />*/}
    </Routes>
  );
}
