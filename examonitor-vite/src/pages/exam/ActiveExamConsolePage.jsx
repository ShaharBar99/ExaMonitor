import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { attendanceHandlers } from '../../handlers/attendanceHandlers';
import { incidentHandlers } from '../../handlers/incidentHandlers';
import StudentGrid from '../../components/exam/StudentGrid';
import ExamBotPanel from '../../components/exam/ExamBotPanel';
import ExamTimer from '../../components/exam/ExamTimer';

export default function ActiveExamConsolePage() {
  const { examId } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // טעינה מה-API
  useEffect(() => {
    attendanceHandlers.initConsole(examId, setStudents, setLoading);
  }, [examId]);

  // עדכון סטטוס
  const handleStatusChange = async (studentId, newStatus) => {
    await attendanceHandlers.changeStudentStatus(studentId, newStatus, setStudents);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-slate-400">
      מתחבר למערכת...
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden font-sans" dir="rtl">
      
      {/* HEADER מוגדל (לפי התמונה) */}
      <header className="bg-white border-b border-slate-100 px-10 py-6 flex justify-between items-center z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="bg-[#0f172a] p-3.5 rounded-[22px] text-white shadow-xl shadow-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Exam Console</h1>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-[0.2em]">Live Monitoring | Room 302</p>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <button 
            onClick={() => incidentHandlers.handleCallManager(examId, "302")}
            className="flex items-center gap-4 bg-[#fffbeb] text-[#92400e] hover:bg-[#fef3c7] px-10 py-5 rounded-3xl text-xl font-black border-2 border-[#fde68a] transition-all active:scale-95 shadow-sm"
          >
            קריאה למשגיח קומה
            <span className="w-3.5 h-3.5 bg-[#f59e0b] rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]"></span>
          </button>

          <div className="h-14 w-0.5 bg-slate-100 mx-2"></div>

          <div className="scale-[1.35]">
            <ExamTimer initialSeconds={5391} onTimeUp={() => alert("הזמן נגמר")} />
          </div>

          <div className="h-14 w-0.5 bg-slate-100 mx-2"></div>

          <button className="bg-[#0f172a] text-white px-12 py-5 rounded-3xl text-xl font-black hover:bg-red-600 transition-all shadow-2xl shadow-slate-300 active:scale-95 uppercase tracking-tight">
            סיום מבחן
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* פאנל הבוט (צ'אט) */}
        <ExamBotPanel />

        {/* ה-Grid נקי לחלוטין מבלוקים עליונים */}
        <main className="flex-1 overflow-y-auto p-12 bg-[#f8fafc]">
          <StudentGrid 
            students={students} 
            onStatusChange={handleStatusChange} 
          />
        </main>
      </div>
    </div>
  );
}