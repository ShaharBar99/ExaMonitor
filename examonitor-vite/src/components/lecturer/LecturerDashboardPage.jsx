import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { attendanceHandlers } from '../../handlers/attendanceHandlers'; 
import { classroomHandler } from '../../handlers/classroomHandlers';
import { incidentHandlers } from '../../handlers/incidentHandlers'; 
import { useAuth } from '../state/AuthContext';
import { useSocket } from '../state/SocketContext';


// רכיבי מערכת
import Sidebar from '../layout/Sidebar';
import SidebarPanel from '../exam/SidebarPanel';
import ExamTimer from '../exam/ExamTimer';
import DashboardLayout from '../layout/DashboardLayout';
import LogsTab from '../floorsupervisor/LogsTab';
import OverviewTab from '../floorsupervisor/OverviewTab';

// לוגיקה ו-Context
import { useExam } from '../state/ExamContext';
import { useTheme } from '../state/ThemeContext'; // הוספת הקונטקסט של העיצוב
import { examHandlers } from '../../handlers/examHandlers';
import { timerHandlers } from '../../handlers/timerHandlers';
import { notificationHandlers } from '../../handlers/notificationHandlers';
import StatCard from '../exam/StatCard';
import ViewClassroomsPage from '../classroom/ViewClassroomsPage';


export default function LecturerDashboardPage() {
  const { examId } = useParams();
  const { examData, setExamData } = useExam();
  const { isDark } = useTheme(); // שימוש במשתנה ה-Theme
  const { user } = useAuth();
  
  // ניהול מצב
  const [activeTab, setActiveTab] = useState('notifications'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Changed to false by default for mobile
  const [notifications, setNotifications] = useState([]);
  const [remainingTime, setRemainingTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attendance, setAttendance] = useState([]); //tk added
  const [classrooms, setClassrooms] = useState([]); //tk added
  const [incidents, setIncidents] = useState([]); //tk added
  const [breaksCount, setBreaksCount] = useState(0); //tk added
  const [activeMainTab, setActiveMainTab] = useState('dashboard'); //tk added

  //tk added
  // רכיב כפתור ל-Navbar העליון
  const NavButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveMainTab(id)}
      className={`px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 md:gap-3
        ${activeMainTab === id
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
          : isDark 
            ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
            : 'bg-slate-100 text-slate-500 hover:bg-white hover:text-indigo-600 border border-slate-200'}`}
    >
      <span>{icon}</span> {label}
    </button>
  );

  

  // אתחול הקונסול
  useEffect(() => {
    const initLecturerConsole = async () => {
      setIsLoading(true);
      await notificationHandlers.loadNotifications(examId, setNotifications, setIsLoading);

      await attendanceHandlers.loadAttendanceByExam(examId, setAttendance, setIsLoading);
    
      await attendanceHandlers.loadBreaksCountByExam(examId, setBreaksCount);

      await classroomHandler.loadDisplayData(
        user.role,
        examId,           // filter by exam INSIDE handler
        null,             // classroomId (not needed here)
        setClassrooms//,    // success callback
      );

      await incidentHandlers.loadIncidents(examId, setIncidents);
      
      const seconds = await timerHandlers.getRemainingSeconds(examId);
      setRemainingTime(seconds);
      setIsLoading(false);
    };
    initLecturerConsole();
  }, [examId]);

  // פעולות (Handlers)
  const handleBroadcast = () => examHandlers.handleBroadcast(examId);
  const handleStatusChange = (newStatus) => examHandlers.handleChangeStatus(examId, newStatus, setExamData);


  //tk changed
  // חישוב נתונים (Memoized)
  const stats = useMemo(() => {

    //const totalRegistered = attendance.length;
    //const total = attendance.filter(a => a.status !== 'absent').length;
    const total = attendance.length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const present = attendance.filter(a => a.status === 'present').length;
    const attendanceRate =
      total > 0
        ? Number((((total - absent) / total) * 100).toFixed(1))
        : 0;

    //console.log('first row keys:', attendance[0] && Object.keys(attendance[0]));
    //console.log('first row:', attendance[0]);

    const submittedCount = attendance.filter(a => a.status === 'submitted').length;
    const submittingPct = total > 0 ? Number(((submittedCount / total) * 100).toFixed(0)) : 0;
    //const inProgressCount = attendance.filter(a => a.status !== 'submitted').length;
    //const progressPct = total > 0 ? Number(((inProgressCount / total) * 100).toFixed(0)) : 0;

    // חישוב זמן הגשה ממוצע
    const finished = attendance.filter(a =>
        (a.status === 'submitted' || a.status === 'finished') && a.check_in_time && a.check_out_time);
    const avgMinutes =
      finished.length > 0
        ? finished.reduce((sum, a) => {
            const start = new Date(a.check_in_time).getTime();
            const end = new Date(a.check_out_time).getTime();
            const diffMin = Math.max(0, (end - start) / 60000);
            return sum + diffMin;
          }, 0) / finished.length
        : 0;
    const totalMinutes = Math.round(avgMinutes);
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    const avgCompletionTime = `${hours}:${minutes}`;


    //const restroomCount = attendance.filter(a => a.status === 'exited_temporarily').length;
    // breaksCount;

    const extraTimeRequests = attendance.filter(a =>
      Number(a?.profiles?.personal_extra_time || 0) > 0).length;

    
    return {
      totalStudents: total,
      submitted: attendance.filter(a => a.status === 'submitted').length,
      activeRooms: classrooms.length,
      flaggedIncidents: incidents.filter(i => i.severity === 'high').length,
      attendanceRate,
      avgCompletionTime: avgCompletionTime,
      breaksCount,
      extraTimeRequests,
      submittingPct,
      //progressPct,
    };
  }, [breaksCount, incidents, attendance, classrooms, notifications]);


  
  //tk added
  // ייצוא לדוח PDF
  const handleExportPdf = () => {
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Exam Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin: 0 0 8px; }
            .meta { color: #555; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
            .card { border: 1px solid #ddd; border-radius: 10px; padding: 12px; }
            .label { color: #666; font-size: 12px; }
            .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
            th { background: #f3f3f3; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Exam Dashboard Report</h1>
          <div class="meta">
            Exam ID: ${examId}<br/>
            Generated: ${new Date().toLocaleString()}
          </div>

          <div class="grid">
            <div class="card"><div class="label">Students in exam</div><div class="value">${stats.totalStudents}</div></div>
            <div class="card"><div class="label">Submitted</div><div class="value">${stats.submitted}</div></div>
            <div class="card"><div class="label">Active rooms</div><div class="value">${stats.activeRooms}</div></div>
            <div class="card"><div class="label">Attendance rate</div><div class="value">${stats.attendanceRate}%</div></div>
            <div class="card"><div class="label">Avg completion time</div><div class="value">${stats.avgCompletionTime}</div></div>
            <div class="card"><div class="label">Incidents (high)</div><div class="value">${stats.flaggedIncidents}</div></div>
            <div class="card"><div class="label">Restroom exits (total)</div><div class="value">${stats.breaksCount}</div></div>
            <div class="card"><div class="label">Extra time (students)</div><div class="value">${stats.extraTimeRequests}</div></div>
          </div>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    w.document.open();
    w.document.write(html);
    w.document.close();
  };






  const tabs = [
    { id: 'floor_chat', icon: '🏢', label: 'משגיח קומה' },

  ];

  return (
    <DashboardLayout
      sidebar={(
        <Sidebar 
          tabs={tabs} 
          activeTab={activeTab}
          setActiveTab={setActiveTab} 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          logoText="מרצה"
          logoColor="bg-rose-600"
          isDark={isDark}
        >
          <SidebarPanel key={activeTab} activeTab={activeTab} userRole="lecturer" isDark={isDark} />
        </Sidebar>
      )}

      header={(
        <div className="flex flex-col lg:flex-row justify-between items-center w-full px-4 md:px-8 lg:px-12 py-4 md:py-8 gap-6 md:gap-8" dir="rtl">
          {/* Left: title + tabs */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 lg:gap-12 w-full lg:w-auto">
            <div className="flex items-center justify-between w-full md:w-auto">
                {/* Mobile Sidebar Toggle */}
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 rounded-lg transition-colors
                bg-slate-200 text-slate-700 
                dark:bg-indigo-500/20 dark:text-indigo-100 dark:border dark:border-indigo-500/30 
                hover:bg-slate-300 dark:hover:bg-indigo-500/40 text-xl">
                  ☰
                </button>
                <div className="text-right md:text-right flex-1 md:flex-none px-4 md:px-0">
                  <h1 className={`text-xl md:text-2xl lg:text-3xl font-bold leading-tight transition-colors ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {activeMainTab === 'dashboard' && 'מסך נתונים'}
                    {activeMainTab === 'rooms' && 'ניהול כיתות'}
                    {activeMainTab === 'logs' && 'סטטיסטיקות'}
                  </h1>
                  <div className="flex items-center justify-end md:justify-start gap-2 md:gap-3 mt-1 md:mt-3">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${
                      examData?.status === 'paused' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    <p className={`font-black uppercase tracking-widest text-[8px] md:text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {examData?.name || 'בחינה כללית'} • {examData?.courseId}
                    </p>
                  </div>
                </div>
            </div>

            {/* Main tabs */}
            <div className={`flex gap-1 md:gap-2 p-1 md:p-1.5 rounded-2xl md:rounded-3xl border backdrop-blur-md transition-all w-full md:w-auto justify-center overflow-x-auto ${
              isDark ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200 shadow-sm'
            }`}>
              <button
                onClick={() => setActiveMainTab('dashboard')}
                className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest transition-all whitespace-nowrap
                  ${activeMainTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:bg-white hover:text-indigo-600'}
                `}
              >
                📊 ראשי
              </button>

              <button
                onClick={() => setActiveMainTab('rooms')}
                className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest transition-all whitespace-nowrap
                  ${activeMainTab === 'rooms'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:bg-white hover:text-indigo-600'}
                `}
              >
                🏫 כיתות
              </button>

              <button
                onClick={() => setActiveMainTab('logs')}
                className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest transition-all whitespace-nowrap
                  ${activeMainTab === 'logs'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:bg-white hover:text-indigo-600'}
                `}
              >
                📊 נתונים
              </button>
            </div>
          </div>

          {/* Right: timer */}
          <div className="scale-100 md:scale-125 lg:mx-6">
            {remainingTime !== null && (
              <ExamTimer
                initialSeconds={remainingTime}
                isPaused={examData?.status === 'paused'}
                isDark={isDark}
              />
            )}
          </div>
        </div>
      )}
    >

      {/* ================= MAIN CONTENT ================= */}

      {activeMainTab === 'dashboard' && (
        <main className={`flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 space-y-6 md:space-y-10 transition-colors ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`} dir="rtl">

          {/* מטריקות מהירות */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard label="רשומים" value={stats.totalStudents} icon="👥" isDark={isDark} />
            <StatCard label="הוגשו" value={stats.submitted} icon="📝" isDark={isDark} />
            <StatCard label="כיתות" value={stats.activeRooms} icon="🏠" isDark={isDark} />
            <StatCard label="חריגים" value={stats.flaggedIncidents} icon="⚠️" isDark={isDark} />
          </div>

          {/* לוח ניתוח נתונים מרכזי */}
          <div className={`rounded-[30px] md:rounded-[50px] p-6 md:p-12 border transition-all ${
            isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-2xl shadow-slate-200/50'
          }`}>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-20">
                <div className="space-y-8 md:space-y-12">
                   <ProgressRow label="נוכחות" percent={stats.attendanceRate} color="bg-emerald-500" isDark={isDark} />
                   <ProgressRow label="שיעור הגשה" percent={stats.submittingPct} color="bg-indigo-600" isDark={isDark} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                   <div className={`p-6 md:p-8 rounded-[30px] md:rounded-[40px] transition-colors ${isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                      <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">זמן הגשה ממוצע</p>
                      <p className={`text-2xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>{stats.avgCompletionTime}</p>
                   </div>
                   <div className={`p-6 md:p-8 rounded-[30px] md:rounded-[40px] transition-colors ${isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                      <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">סה"כ יציאות</p>
                      <p className={`text-2xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>{stats.breaksCount}</p>
                   </div>
                </div>
             </div>
          </div>

        </main>
      )}

      {activeMainTab === 'rooms' && (
        <ViewClassroomsPage isDark={isDark} />
      )}


      {activeMainTab === 'logs' && (
        <div
          className={`flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 space-y-6 md:space-y-10 transition-colors ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`}
          dir="rtl"
        >

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>
              סטטיסטיקות הבחינה
            </h2>

            <button
              onClick={handleExportPdf}
              className="w-full md:w-auto bg-indigo-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs tracking-widest
                        hover:bg-indigo-500 shadow-lg active:scale-95 transition-all"
            >
              יצוא דוח נתונים
            </button>
          </div>

          {/* STAT GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

            <SummaryBox
              icon="📈"
              label="שיעור נוכחות"
              value={`${stats.attendanceRate}%`}
              isDark={isDark}
            />

            <SummaryBox
              icon="✅"
              label="שיעור סיום"
              value={`${stats.submittingPct}%`}
              isDark={isDark}
            />

            <SummaryBox
              icon="⏱️"
              label="ממוצע הגשה"
              value={stats.avgCompletionTime}
              isDark={isDark}
            />

            <SummaryBox
              icon="🚪"
              label="יציאות"
              value={stats.breaksCount}
              isDark={isDark}
            />

            <SummaryBox
              icon="🧊"
              label="תוספת זמן"
              value={stats.extraTimeRequests}
              isDark={isDark}
            />

          </div>
        </div>
      )}
    </DashboardLayout>
  );

}

// --- רכיבי עזר פנימיים ---

const SummaryBox = ({ icon, label, value, isDark }) => (
  <div className={`p-6 md:p-10 rounded-[30px] md:rounded-[40px] flex flex-col items-center justify-center text-center border group transition-all duration-500 ${
    isDark 
      ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60 shadow-xl shadow-black/20' 
      : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl'
  }`}>
    <span className="text-3xl md:text-4xl mb-2 md:mb-4 group-hover:scale-125 transition-transform duration-500">{icon}</span>
    <p className={`text-[12px] md:text-[15px] font-black uppercase mb-1 md:mb-2 tracking-widest ${isDark ? 'text-slate-400' : 'text-[#0f172a]'}`}>{label}</p>
    <p className={`text-2xl md:text-3xl font-black leading-none tabular-nums ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>{value}</p>
  </div>
);

const ProgressRow = ({ label, percent, color, isDark }) => (
  <div className="space-y-2 md:space-y-4 group">
    <div className="flex justify-between items-end px-2">
      <span className={`text-[12px] md:text-[15px] font-black uppercase tracking-widest transition-colors ${
        isDark ? 'text-slate-300' : 'text-black group-hover:text-slate-800'
      }`}>{label}</span>
      <span className={`text-base md:text-lg font-black tabular-nums ${isDark ? 'text-white' : 'text-black'}`}>{percent}%</span>
    </div>
    <div className={`h-4 md:h-6 rounded-full overflow-hidden p-1 md:p-1.5 shadow-inner transition-colors ${
      isDark ? 'bg-slate-800' : 'bg-slate-100'
    }`}>
      <div className={`h-full ${color} rounded-full transition-all duration-1000 shadow-lg group-hover:brightness-110`} style={{ width: `${percent}%` }}></div>
    </div>
  </div>
);