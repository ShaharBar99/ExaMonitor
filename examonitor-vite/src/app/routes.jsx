import React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import ManageUsersPage from "../pages/admin/ManageUsersPage";
import SelectExamPage from "../pages/exam/SelectExamPage";
import SupervisorDashboardPage from "../pages/supervisor/SupervisorDashboardPage";

export default function AppRoutes() {
  const navigate = useNavigate();
  return (
    <Routes>
      {/*<Route path="/login" element={<LoginPage />} />*/}
      
      {/* זה הדף שאנחנו רוצים להגיע אליו */}
      <Route path="/" element={<SelectExamPage navigate={navigate} />} />
      
      {/* דף המבחן עצמו (אחרי שבוחרים) */}
      <Route path="/exam/active/:examId" element={<SupervisorDashboardPage />} />
      
      {/*<Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />*/}
    </Routes>
  );
}
