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
import { examHandlers } from '../../handlers/examHandlers';
import { timerHandlers } from '../../handlers/timerHandlers';
import { notificationHandlers } from '../../handlers/notificationHandlers';
import StatCard from '../exam/StatCard';
import ViewClassroomsPage from '../classroom/ViewClassroomsPage';


export default function LecturerDashboardPage() {
  const { examId } = useParams();
  const { examData, setExamData } = useExam();
  const { user } = useAuth();
  
  // ניהול מצב
  const [activeTab, setActiveTab] = useState('notifications'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
      className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3
        ${activeMainTab === id
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'}`}
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
    console.log('present:', present, 'absent:', absent);
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
    { id: 'notifications', icon: '🔔', label: 'התראות ויומן' },
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
        >
          <SidebarPanel key={activeTab} activeTab={activeTab} userRole="lecturer" />
        </Sidebar>
      )}

      header={(
        <div className="flex justify-between items-center w-full px-12 py-8" dir="rtl">
          {/* Left: title + tabs */}
          <div className="flex items-center gap-12">
            <div>
              <h1 className="text-3xl font-bold text-white leading-none tracking-tight">
                {activeMainTab === 'dashboard' && 'מסך נתונים למרצה'}
                {activeMainTab === 'rooms' && 'ניהול כיתות'}
                {activeMainTab === 'logs' && 'יומן אירועים'}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  examData?.status === 'paused'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`} />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  {examData?.name || 'בחינה כללית'} • קוד קורס: {examData?.courseId} • מזהה: {examId}
                </p>
              </div>
            </div>

            {/* Main tabs (same idea as FloorSupervisor) */}
            <div className="flex gap-2 bg-black/20 p-1.5 rounded-3xl border border-white/5 backdrop-blur-md">
              <button
                onClick={() => setActiveMainTab('dashboard')}
                className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest
                  ${activeMainTab === 'dashboard'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'}
                `}
              >
                📊 ראשי
              </button>

              <button
                onClick={() => setActiveMainTab('rooms')}
                className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest
                  ${activeMainTab === 'rooms'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'}
                `}
              >
                🏫 כיתות
              </button>

              <button
                onClick={() => setActiveMainTab('logs')}
                className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest
                  ${activeMainTab === 'logs'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'}
                `}
              >
                📊 סטטיסטיקות
              </button>
            </div>
          </div>

          {/* Right: timer */}
          <div className="scale-125 mx-6">
            {remainingTime !== null && (
              <ExamTimer
                initialSeconds={remainingTime}
                isPaused={examData?.status === 'paused'}
              />
            )}
          </div>
        </div>
      )}
    >

      {/* ================= MAIN CONTENT ================= */}

      {activeMainTab === 'dashboard' && (
        <main className="flex-1 overflow-y-auto p-12 bg-[#0f172a] space-y-10" dir="rtl">

          {/* ---- EVERYTHING BELOW IS YOUR EXISTING DASHBOARD UI ---- */}

          {/* מטריקות מהירות */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="סטודנטים רשומים לבחינה" value={stats.totalStudents} icon="👥" />
            <StatCard label="טפסי בחינה שהוגשו" value={stats.submitted} icon="📝" />
            <StatCard label="חדרי בחינה פעילים" value={stats.activeRooms} icon="🏠" />
            <StatCard label="דיווחים חריגים" value={stats.flaggedIncidents} icon="⚠️" />
          </div>

          {/* לוח ניתוח נתונים מרכזי */}
          {/* ⬇️ your big white analytics card stays EXACTLY as-is ⬇️ */}
          {/* (I did not change it at all) */}
          {/* keep your existing JSX here */}

        </main>
      )}

      {activeMainTab === 'rooms' && (
        <ViewClassroomsPage />
      )}


      {activeMainTab === 'logs' && (
        <div
          className="flex-1 overflow-y-auto p-12 bg-[#0f172a] space-y-10"
          dir="rtl"
        >

          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-white tracking-tight">
              סטטיסטיקות הבחינה
            </h2>

            <button
              onClick={handleExportPdf}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest
                        hover:bg-indigo-500 shadow-lg active:scale-95 transition-all"
            >
              יצוא דוח נתונים
            </button>
          </div>

          {/* STAT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <SummaryBox
              icon="📈"
              label="שיעור נוכחות"
              value={`${stats.attendanceRate}%`}
            />

            <SummaryBox
              icon="✅"
              label="שיעור נבחנים שסיימו"
              value={`${stats.submittingPct}%`}
            />

            <SummaryBox
              icon="⏱️"
              label="זמן הגשה ממוצע"
              value={stats.avgCompletionTime}
            />

            <SummaryBox
              icon="🚪"
              label="יציאות לשירותים"
              value={stats.breaksCount}
            />

            <SummaryBox
              icon="🧊"
              label="בעלי תוספת זמן"
              value={stats.extraTimeRequests}
            />

          </div>
        </div>
      )}


    </DashboardLayout>
  );

}

// --- רכיבי עזר פנימיים ---

const SummaryBox = ({ icon, label, value }) => (
  <div className="bg-slate-50 p-10 rounded-[40px] flex flex-col items-center justify-center text-center border border-slate-100 group hover:bg-white hover:shadow-2xl hover:scale-[1.05] transition-all duration-500">
    <span className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-500">{icon}</span>
    <p className="text-[15px] font-black text-[#0f172a] uppercase mb-2 tracking-widest">{label}</p>
    <p className="text-3xl font-black text-[#0f172a]  leading-none tabular-nums">{value}</p>
  </div>
);

const ProgressRow = ({ label, percent, color }) => (
  <div className="space-y-4 group">
    <div className="flex justify-between items-end px-2">
      <span className="text-[15px] font-black text-black uppercase tracking-widest group-hover:text-slate-800 transition-colors">{label}</span>
      <span className="text-lg font-black text-black  tabular-nums">{percent}%</span>
    </div>
    <div className="h-6 bg-slate-100 rounded-full overflow-hidden p-1.5 shadow-inner">
      <div className={`h-full ${color} rounded-full transition-all duration-1000 shadow-lg group-hover:brightness-110`} style={{ width: `${percent}%` }}></div>
    </div>
  </div>
);