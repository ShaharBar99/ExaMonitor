// src/pages/student/StudentPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStudentExams } from "../../handlers/studentHandlers";
import { useAuth } from "../state/AuthContext";
import { useTheme } from "../state/ThemeContext"; // ייבוא ה-Theme

function ExamCard({ exam, isDark }) { // הוספת isDark כ-prop
  const start = exam.original_start_time
    ? new Date(exam.original_start_time)
    : null;

  return (
    <div className={`rounded-2xl border transition-all duration-300 p-5 shadow-sm hover:shadow-md ${
      isDark 
        ? "bg-slate-900/50 border-white/10 hover:border-blue-500/30" 
        : "bg-white border-slate-200"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className={`text-base font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            {exam.course_name}
          </h3>
          <p className={`text-xs font-bold ${isDark ? "text-slate-500" : "text-slate-500"}`}>
            {exam.course_code}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
            ${
              exam.status === "active"
                ? (isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-700")
                : (isDark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-600")
            }`}
        >
          {exam.status || "unknown"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-4">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>מועד</p>
          <p className={`font-bold ${isDark ? "text-slate-300" : "text-slate-800"}`}>
            {start ? start.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }) : "-"}
          </p>
        </div>

        <div>
          <p className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>משך</p>
          <p className={`font-bold ${isDark ? "text-slate-300" : "text-slate-800"}`}>
            {exam.original_duration ?? "-"} דק׳
          </p>
        </div>

        <div>
          <p className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>תוספת זמן</p>
          <p className={`font-bold ${isDark ? "text-slate-300" : "text-slate-800"}`}>
            {exam.extra_time ?? 0} דק׳
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StudentPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme(); // שימוש ב-Theme

  const [state, setState] = useState({
    exams: [],
    loading: false,
    error: "",
  });

  useEffect(() => {
    loadStudentExams(setState);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Top Bar */}
      <header className={`border-b transition-all duration-300 ${
        isDark ? "bg-slate-900/80 border-white/5 backdrop-blur-md" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl ${
              isDark ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-600 text-white"
            }`}>
              S
            </div>
            <div>
              <h1 className={`text-lg font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                אזור סטודנט
              </h1>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                ניהול וצפייה במבחנים פעילים
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all hover:scale-110 active:scale-95 ${
                isDark 
                  ? "bg-slate-800 border-white/10 text-amber-400" 
                  : "bg-slate-100 border-slate-200 text-amber-600"
              }`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
            >
              התנתקות
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {state.error && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-500 font-bold backdrop-blur-sm">
            {state.error}
          </div>
        )}

        {state.loading && (
          <div className={`rounded-2xl p-12 text-center text-sm font-bold animate-pulse ${
            isDark ? "bg-slate-900/50 text-slate-500" : "bg-white text-slate-400 border border-slate-200"
          }`}>
            טוען מבחנים...
          </div>
        )}

        {!state.loading && !state.error && state.exams.length === 0 && (
          <div className={`rounded-2xl p-12 text-center border-2 border-dashed transition-colors ${
            isDark ? "border-white/5 text-slate-600" : "border-slate-200 text-slate-400"
          }`}>
            <p className="text-sm font-bold">לא נמצאו מבחנים לסטודנט זה.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {state.exams.map((exam) => (
            <ExamCard key={exam.exam_id} exam={exam} isDark={isDark} />
          ))}
        </div>
      </main>
    </div>
  );
}