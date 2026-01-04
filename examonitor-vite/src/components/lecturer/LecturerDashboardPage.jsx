import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// רכיבי מערכת
import Sidebar from '../layout/Sidebar';
import SidebarPanel from '../exam/SidebarPanel';
import ExamTimer from '../exam/ExamTimer';

// לוגיקה ו-Context
import { useExam } from '../state/ExamContext';
import { examHandlers } from '../../handlers/examHandlers';
import { timerHandlers } from '../../handlers/timerHandlers';
import { notificationHandlers } from '../../handlers/notificationHandlers';
import StatCard from '../exam/StatCard';

export default function LecturerDashboardPage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { examData, setExamData } = useExam();
  
  // ניהול מצב
  const [activeTab, setActiveTab] = useState('notifications'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [remainingTime, setRemainingTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // אתחול הקונסול
  useEffect(() => {
    const initLecturerConsole = async () => {
      setIsLoading(true);
      await notificationHandlers.loadNotifications(examId, setNotifications, setIsLoading);
      const seconds = await timerHandlers.getRemainingSeconds(examId);
      setRemainingTime(seconds);
      setIsLoading(false);
    };
    initLecturerConsole();
  }, [examId]);

  // פעולות (Handlers)
  const handleBroadcast = () => examHandlers.handleBroadcast(examId);
  const handleStatusChange = (newStatus) => examHandlers.handleChangeStatus(examId, newStatus, setExamData);

  // חישוב נתונים (Memoized)
  const stats = useMemo(() => ({
    totalStudents: examData?.totalStudents || 0,
    submitted: examData?.submittedCount || 0,
    activeRooms: examData?.roomsCount || 0,
    flaggedIncidents: notifications.filter(n => n.severity === 'high' && !n.isRead).length,
    attendanceRate: 98.2, 
    avgCompletionTime: "01:45"
  }), [examData, notifications]);

  const tabs = [
    { id: 'floor_chat', icon: '🏢', label: 'משגיח קומה' },
    { id: 'notifications', icon: '🔔', label: 'התראות ויומן' },
  ];

  return (
    <div className="h-screen flex bg-[#0f172a] overflow-hidden font-sans text-right text-white" dir="rtl">
      
      {/* תפריט צד */}
      <Sidebar 
        tabs={tabs} 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        logoText="מרצה" logoColor="bg-rose-600"
      >
        <SidebarPanel key={activeTab} activeTab={activeTab} userRole="lecturer" />
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* כותרת עליונה - Glassmorphism */}
        <header className="bg-white/5 border-b border-white/10 px-12 py-8 flex justify-between items-center z-30 backdrop-blur-md">
          <div className="flex items-center gap-10">
            <div>
              <h1 className="text-3xl font-black italic leading-none tracking-tight">קונסול מרצה</h1>
              <div className="flex items-center gap-3 mt-3">
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${examData?.status === 'paused' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></span>
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  {examData?.name || 'בחינה כללית'} • קוד קורס: {examData?.courseId} • מזהה: {examId}
                </p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/exam/view-classrooms', { state: { role: 'lecturer' } })}
              className="flex items-center gap-3 bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl font-black text-xs tracking-widest hover:bg-white/10 transition-all active:scale-95 shadow-lg shadow-black/20"
            >
              <span className="text-xl">📊</span>
              מעקב פריסת חדרים
            </button>
          </div>

          <div className="flex items-center gap-8">
            <div className="scale-125 mx-6">
              {remainingTime !== null && (
                <ExamTimer 
                  initialSeconds={remainingTime} 
                  isPaused={examData?.status === 'paused'} 
                />
              )}
            </div>
            <button 
              onClick={handleBroadcast}
              className="bg-rose-600 text-white px-10 py-5 rounded-2xl font-black text-xs tracking-widest hover:bg-rose-500 shadow-2xl shadow-rose-900/40 active:scale-95 transition-all"
            >
              שידור הודעה לכל הנבחנים
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 bg-[#0f172a] space-y-10">
          
          {/* מטריקות מהירות */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="סטודנטים בבחינה" value={stats.totalStudents} color="white" icon="👥" />
            <StatCard label="טפסי בחינה שהוגשו" value={stats.submitted} color="emerald" progress={stats.totalStudents > 0 ? (stats.submitted/stats.totalStudents)*100 : 0} icon="📝" />
            <StatCard label="חדרי בחינה פעילים" value={stats.activeRooms} color="blue" icon="🏠" />
            <StatCard label="דיווחים חריגים" value={stats.flaggedIncidents} color="rose" highlight={stats.flaggedIncidents > 0} icon="⚠️" />
          </div>

          {/* לוח ניתוח נתונים מרכזי */}
          <div className="bg-white rounded-[50px] p-12 shadow-2xl border border-white/10 overflow-hidden relative">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-4xl font-black text-[#0f172a] italic tracking-tight uppercase">ניתוח נתונים מתקדם</h3>
                <p className="text-slate-400 font-bold text-[11px] mt-2 uppercase tracking-widest">בקרה וניטור תהליך הבחינה בזמן אמת</p>
              </div>
              <div className="flex gap-4">
                  <button onClick={() => handleStatusChange(examData?.status === 'active' ? 'paused' : 'active')} 
                          className={`px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${examData?.status === 'active' ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'}`}>
                    {examData?.status === 'active' ? 'הקפאת בחינה גלובלית' : 'חידוש בחינה'}
                  </button>
                  <button className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-colors">
                    ייצוא דוח נתונים
                  </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
              {/* מדדי התקדמות */}
              <div className="space-y-12">
                <ProgressRow label="שיעור נוכחות נוכחי" percent={stats.attendanceRate} color="bg-rose-500" />
                <ProgressRow label="קצב התקדמות נבחנים" percent={75} color="bg-indigo-500" />
                <ProgressRow label="נבחנים בשלב ההגשה" percent={15} color="bg-emerald-500" />
              </div>

              {/* קוביות סיכום */}
              <div className="grid grid-cols-2 gap-6">
                <SummaryBox icon="⏱️" label="זמן הגשה ממוצע" value={stats.avgCompletionTime} />
                <SummaryBox icon="🧊" label="בקשות הארכה" value="4" />
                <SummaryBox icon="🚪" label="יציאות לשירותים" value="12" />
                <SummaryBox icon="📢" label="הודעות שנשלחו" value="3" />
              </div>
            </div>

            <div className="mt-16 pt-8 border-t border-slate-50 flex justify-between items-center opacity-40">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  סנכרון נתונים פעיל • מערכת מבוזרת
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  עדכון אחרון: {new Date().toLocaleTimeString('he-IL')}
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- רכיבי עזר פנימיים ---

const SummaryBox = ({ icon, label, value }) => (
  <div className="bg-slate-50 p-10 rounded-[40px] flex flex-col items-center justify-center text-center border border-slate-100 group hover:bg-white hover:shadow-2xl hover:scale-[1.05] transition-all duration-500">
    <span className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-500">{icon}</span>
    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{label}</p>
    <p className="text-3xl font-black text-[#0f172a] italic leading-none tabular-nums">{value}</p>
  </div>
);

const ProgressRow = ({ label, percent, color }) => (
  <div className="space-y-4 group">
    <div className="flex justify-between items-end px-2">
      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">{label}</span>
      <span className="text-lg font-black text-slate-400 italic tabular-nums">{percent}%</span>
    </div>
    <div className="h-6 bg-slate-100 rounded-full overflow-hidden p-1.5 shadow-inner">
      <div className={`h-full ${color} rounded-full transition-all duration-1000 shadow-lg group-hover:brightness-110`} style={{ width: `${percent}%` }}></div>
    </div>
  </div>
);