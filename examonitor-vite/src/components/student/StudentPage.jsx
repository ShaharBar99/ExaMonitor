import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStudentExams } from "../../handlers/studentHandlers";
import { useAuth } from "../state/AuthContext";

function ExamCard({ exam }) {
  const start = exam.original_start_time
    ? new Date(exam.original_start_time)
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {exam.course_name}
          </h3>
          <p className="text-xs text-slate-500">{exam.course_code}</p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold
            ${
              exam.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
        >
          {exam.status || "unknown"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-slate-500 text-xs">מועד</p>
          <p className="font-medium text-slate-800">
            {start ? start.toLocaleString() : "-"}
          </p>
        </div>

        <div>
          <p className="text-slate-500 text-xs">משך</p>
          <p className="font-medium text-slate-800">
            {exam.original_duration ?? "-"} דק׳
          </p>
        </div>

        <div>
          <p className="text-slate-500 text-xs">תוספת זמן</p>
          <p className="font-medium text-slate-800">
            {exam.extra_time ?? 0} דק׳
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StudentPage() {
  const navigate = useNavigate();
  const { logout } = useAuth(); // ✅ correct logout source

  const [state, setState] = useState({
    exams: [],
    loading: false,
    error: "",
  });

  useEffect(() => {
    loadStudentExams(setState);
  }, []);

  const handleLogout = () => {
    logout();          // clear auth state
    navigate("/login"); // redirect
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">
              אזור סטודנט
            </h1>
            <p className="text-sm text-slate-500">
              צפייה במבחנים לפי רישום לקורסים
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
          >
            התנתקות
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {state.error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {state.loading && (
          <div className="rounded-xl bg-white p-6 text-sm text-slate-600 border border-slate-200">
            טוען מבחנים...
          </div>
        )}

        {!state.loading && !state.error && state.exams.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-sm text-slate-600 border border-slate-200">
            לא נמצאו מבחנים לסטודנט זה.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.exams.map((exam) => (
            <ExamCard key={exam.exam_id} exam={exam} />
          ))}
        </div>
      </main>
    </div>
  );
}
