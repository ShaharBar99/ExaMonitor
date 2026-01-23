import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { classroomHandler } from '../../handlers/classroomHandlers';
import { useAuth } from '../state/AuthContext';
import { useSocket } from '../state/SocketContext';
import { useTheme } from '../state/ThemeContext'; // ייבוא ה-Theme

// רכיבי תשתית
import Sidebar from '../../components/layout/Sidebar';
import SidebarPanel from '../../components/exam/SidebarPanel';
import DashboardLayout from '../../components/layout/DashboardLayout';

// טאבים מרכזיים
import OverviewTab from './OverviewTab';
import LogsTab from './LogsTab';
import ViewClassroomsPage from '../classroom/ViewClassroomsPage';
import IncidentReportPage from '../supervisor/IncidentReportPage';

// לוגיקה ונתונים
import { notificationHandlers } from '../../handlers/notificationHandlers';
import { incidentHandlers } from '../../handlers/incidentHandlers';
import { useExam } from '../state/ExamContext';

export default function FloorSupervisorDashboardPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { examData } = useExam();
  const { user } = useAuth();
  const socket = useSocket();
  const { isDark } = useTheme(); // שימוש בערך ה-Theme

  // --- ניהול ניווט עליון ---
  const [activeMainTab, setActiveMainTab] = useState('dashboard');

  // --- ניהול Sidebar ---
  const [activeSidebarTab, setActiveSidebarTab] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default false for mobile responsiveness

  // נתונים
  const [rooms, setRooms] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  const [messages, setMessages] = useState({
    supervisor_floor_chat: [],
    floor_lecturer_chat: []
  });

  // טעינת נתונים
  const fetchDashboardData = useCallback(() => {
    notificationHandlers.loadNotifications('floor_3',
      (data) => { setNotifications(data); },
      (loading) => { setIsLoadingNotifications(loading); }
    );

    classroomHandler.loadDisplayData(user.role, null, null, (data) => {
      setRooms(data);
    });

    const currentExamId = examId || examData?.id;
    incidentHandlers.loadIncidents(currentExamId, setIncidents);
  }, [examId, examData, user.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!socket || !user.role) return;

    Object.values(user.role).forEach(chat => {
      socket.emit('join_room', chat.type);
    });

    const handleNewMessage = (message) => {
      if (!message || !message.room) return;
      setMessages(prev => {
        const existingMessages = prev[message.room] || [];
        return { ...prev, [message.room]: [...existingMessages, message] };
      });
    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, user.role]);

  // חישוב סטטיסטיקות
  const stats = useMemo(() => {
    if (!rooms) return { activeRooms: 0, warnings: 0, totalStudents: 0 };
    const criticalIncidentsCount = incidents.filter(log => log.severity === 'high' || log.severity === 'critical').length;
    return {
      activeRooms: rooms.filter(r => r.status === 'active').length,
      warnings: criticalIncidentsCount,
      totalStudents: rooms.reduce((acc, curr) => acc + (curr.studentsCount || 0), 0),
    };
  }, [rooms, incidents]);

  const sidebarTabs = [
    { id: 'chat', icon: '👥', label: "צ'אט צוות" },
    { id: 'lecturer', icon: '👨‍🏫', label: "קשר למרצה" },
  ];

  // רכיב כפתור ל-Navbar העליון - מותאם Theme
  const NavButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveMainTab(id)}
      className={`px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 md:gap-3 whitespace-nowrap
          ${activeMainTab === id
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
          : isDark
            ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 border border-slate-200'}`}
    >
      <span className="text-sm md:text-base">{icon}</span> {label}
    </button>
  );

  if (isLoadingNotifications && notifications.length === 0) {
    return (
      <div className={`h-screen flex items-center justify-center font-black uppercase tracking-widest p-6 text-center ${isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'}`}>
        מאתחל מערכת שליטה...
      </div>
    );
  }

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          tabs={sidebarTabs}
          activeTab={activeSidebarTab}
          setActiveTab={setActiveSidebarTab}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          logoText="FM"
          logoColor="bg-indigo-600"
          isDark={isDark}
        >
          <SidebarPanel key={activeSidebarTab} activeTab={activeSidebarTab} userRole="floor_manager" isDark={isDark} />
        </Sidebar>
      }
      header={
        <div className="flex flex-col lg:flex-row justify-between items-center w-full gap-4 md:gap-6" dir="rtl">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 lg:gap-12 w-full lg:w-auto">

            {/* Title Section with Mobile Toggle */}
            <div className="flex items-center justify-between w-full md:w-auto">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg transition-colors bg-slate-200 text-slate-700 dark:bg-indigo-500/20 dark:text-indigo-100 dark:border dark:border-indigo-500/30 text-xl"
              >
                ☰
              </button>

              <h1 className={`text-xl md:text-2xl font-black uppercase tracking-tighter px-4 lg:px-0 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeMainTab === 'dashboard' ? 'Control' :
                  activeMainTab === 'rooms' ? 'Rooms' : 'History'}
              </h1>

              {/* Mobile-only Stats */}
              <div className="md:hidden">
                <div className={`px-4 py-1 rounded-lg border flex items-center gap-2 ${stats.warnings > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-transparent border-transparent'}`}>
                  <span className="text-xs">⚠️</span>
                  <span className={`font-black ${stats.warnings > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{stats.warnings}</span>
                </div>
              </div>
            </div>

            {/* Main Navigation Bar */}
            <nav className={`flex gap-1 md:gap-2 p-1 md:p-1.5 rounded-2xl md:rounded-3xl border backdrop-blur-md transition-colors w-full md:w-auto overflow-x-auto no-scrollbar ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-200/50 border-slate-300/50'
              }`}>
              <NavButton id="dashboard" label="ראשי" icon="📊" />
              <NavButton id="rooms" label="כיתות" icon="🏫" />
              <NavButton id="logs" label="יומן אירועים" icon="📜" />
              <NavButton id="report" label="דיווח" icon="⚠️" />
            </nav>
          </div>

          {/* Desktop Stats Section */}
          <div className="hidden md:flex gap-4">
            <div className={`px-6 py-2 rounded-xl border flex flex-col items-center min-w-24 transition-all
                ${stats.warnings > 0
                ? 'bg-rose-500/10 border-rose-500/20 animate-pulse'
                : isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
              <p className={`text-[9px] font-black uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>קריאות</p>
              <p className={`text-lg font-black ${stats.warnings > 0 ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats.warnings}
              </p>
            </div>
          </div>
        </div>
      }
    >
      {/* גוף העמוד - מותאם Theme */}
      <div className={`w-full h-full animate-in fade-in duration-500 p-4 md:p-6 lg:p-0 ${isDark ? 'text-white' : 'text-slate-900'}`} dir="rtl">
        {activeMainTab === 'dashboard' && (
          <OverviewTab stats={stats} onNavigate={setActiveMainTab} isDark={isDark} />
        )}

        {activeMainTab === 'rooms' && (
          <ViewClassroomsPage isDark={isDark} />
        )}

        {activeMainTab === 'logs' && (
          <LogsTab notifications={notifications} incidents={incidents} stats={stats} isDark={isDark} />
        )}

        {activeMainTab === 'report' && (
          <div className="w-full max-w-6xl mx-auto animate-in zoom-in-95 duration-500">
            <IncidentReportPage
              examId={examId || examData?.id}
              classrooms={{ room_number: '' }}
              availableRooms={rooms}
              onBack={() => {
                fetchDashboardData();
                setActiveMainTab('dashboard');
              }}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}