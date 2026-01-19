import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
  useEffect(() => {
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
      className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3
          ${activeMainTab === id
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
          : isDark 
            ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 border border-slate-200'}`}
    >
      <span className="text-base">{icon}</span> {label}
    </button>
  );

  if (isLoadingNotifications && notifications.length === 0) {
    return (
      <div className={`h-screen flex items-center justify-center font-black uppercase tracking-widest ${isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'}`}>
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
        <div className="flex justify-between items-center w-full" dir="rtl">
          <div className="flex items-center gap-12">
            <div>
              <h1 className={`text-2xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeMainTab === 'dashboard' ? 'Control Center' :
                  activeMainTab === 'rooms' ? 'Room Management' : 'Event History'}
              </h1>
            </div>

            {/* ה-Navbar המרכזי מותאם Theme */}
            <nav className={`flex gap-2 p-1.5 rounded-3xl border backdrop-blur-md transition-colors ${
              isDark ? 'bg-black/20 border-white/5' : 'bg-slate-200/50 border-slate-300/50'
            }`}>
              <NavButton id="dashboard" label="ראשי" icon="📊" />
              <NavButton id="rooms" label="כיתות" icon="🏫" />
            </nav>
          </div>

          {/* סטטיסטיקה מהירה בצד שמאל */}
          <div className="flex gap-4">
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
      <div className={`w-full h-full animate-in fade-in duration-500 ${isDark ? 'text-white' : 'text-slate-900'}`} dir="rtl">
        {activeMainTab === 'dashboard' && (
          <OverviewTab stats={stats} onNavigate={setActiveMainTab} isDark={isDark} />
        )}

        {activeMainTab === 'rooms' && (
          <ViewClassroomsPage isDark={isDark} />
        )}

        {activeMainTab === 'logs' && (
          <LogsTab notifications={notifications} incidents={incidents} stats={stats} isDark={isDark} />
        )}
      </div>
    </DashboardLayout>
  );
}