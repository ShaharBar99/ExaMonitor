import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { classroomHandler } from '../../handlers/classroomHandlers';
import { useAuth } from '../state/AuthContext';
import { useSocket } from '../state/SocketContext';

// רכיבי תשתית
import Sidebar from '../../components/layout/Sidebar';
import SidebarPanel from '../../components/exam/SidebarPanel';
import DashboardLayout from '../../components/layout/DashboardLayout';

// טאבים מרכזיים (הפרדנו אותם כדי שהקוד יהיה נקי)
import OverviewTab from './OverviewTab';
import LogsTab from './LogsTab';
import ViewClassroomsPage from '../classroom/ViewClassroomsPage';

// לוגיקה ונתונים
import { notificationHandlers } from '../../handlers/notificationHandlers';
import { INITIAL_ROOMS, AVAILABLE_SUPERVISORS } from '../../mocks/floorSupervisor_MockData';
import { useExam } from '../state/ExamContext';

export default function FloorSupervisorDashboardPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { examData } = useExam();
  const { user } = useAuth();
  const socket = useSocket();

  // --- ניהול ניווט עליון (החלפת תוכן מרכזי) ---
  const [activeMainTab, setActiveMainTab] = useState('dashboard');

  // --- ניהול Sidebar (צ'אט, מרצה, יומן) ---
  const [activeSidebarTab, setActiveSidebarTab] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // נתונים
  const [rooms, setRooms] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  const [messages, setMessages] = useState({
    supervisor_floor_chat: [],
    floor_lecturer_chat: []
  });


  // טעינת נתונים
  useEffect(() => {
    let isMounted = true;
    notificationHandlers.loadNotifications('floor_3',
      (data) => { if (isMounted) setNotifications(data); },
      (loading) => { if (isMounted) setIsLoadingNotifications(loading); }
    );

    // Load classrooms data
    classroomHandler.loadDisplayData(user.role, null, null, (data) => {
      if (isMounted) setRooms(data);
    });

    return () => { isMounted = false; };
  }, [examId, user.role]);

  useEffect(() => {
  // 1. Safety check for socket and userRole
  if (!socket || !user.role ) return;



  // 2. Join rooms
  Object.values(user.role).forEach(chat => {
    socket.emit('join_room', chat.type);
  });

  const handleNewMessage = (message) => {
    // 3. Safety check: does the message have a room and do we care about it?
    if (!message || !message.room) return;

    setMessages(prev => {
      // Ensure the room exists in our state so we don't crash
      const existingMessages = prev[message.room] || [];
      return {
        ...prev,
        [message.room]: [...existingMessages, message]
      };
    });
  };

  socket.on('new_message', handleNewMessage);
  
  return () => {
    socket.off('new_message', handleNewMessage);
  };
}, [socket, user.role]); // Added userRole to dependencies
  // חישוב סטטיסטיקות
  const stats = useMemo(() => {
    if (!rooms) return { activeRooms: 0, warnings: 0, totalStudents: 0, supervisorsOnFloor: 0 };
    return {
      activeRooms: rooms.filter(r => r.status === 'active').length,
      warnings: rooms.filter(r => r.status === 'warning').length,
      totalStudents: rooms.reduce((acc, curr) => acc + (curr.studentsCount || 0), 0),
      supervisorsOnFloor: AVAILABLE_SUPERVISORS.length
    };
  }, [rooms]);

const sidebarTabs = [
  { id: 'chat', icon: '👥', label: "צ'אט צוות" },
  { id: 'lecturer', icon: '👨‍🏫', label: "קשר למרצה" },
  { id: 'notifications', icon: '📋', label: "יומן קומה" }
];

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

if (isLoadingNotifications && notifications.length === 0) {
  return (
    <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white font-black uppercase tracking-widest">
      מאתחל מערכת שליטה...
    </div>
  );
}

return (
  <DashboardLayout
    /* סיידבר בתצורה המקורית והמלאה שלך */
    sidebar={
      <Sidebar
        tabs={sidebarTabs}
        activeTab={activeSidebarTab}
        setActiveTab={setActiveSidebarTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        logoText="FM"
        logoColor="bg-indigo-600"
      >
        <SidebarPanel key={activeSidebarTab} activeTab={activeSidebarTab} userRole="floor_manager" />
      </Sidebar>
    }
    /* הדר משולב עם ה-Navbar החדש */
    header={
      <div className="flex justify-between items-center w-full" dir="rtl">
        <div className="flex items-center gap-12">
          <div>
            <h1 className="text-2xl text-white font-black uppercase tracking-tighter">
              {activeMainTab === 'dashboard' ? 'Control Center' :
                activeMainTab === 'rooms' ? 'Room Management' : 'Event History'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                קומה {examData?.floor || '03'} • {examData?.courseName || 'בחינה פעילה'}
              </p>
            </div>
          </div>

          {/* ה-Navbar המרכזי */}
          <nav className="flex gap-2 bg-black/20 p-1.5 rounded-3xl border border-white/5 backdrop-blur-md">
            <NavButton id="dashboard" label="ראשי" icon="📊" />
            <NavButton id="rooms" label="כיתות" icon="🏫" />
            <NavButton id="logs" label="יומן" icon="📋" />
          </nav>
        </div>

        {/* סטטיסטיקה מהירה בצד שמאל */}
        <div className="flex gap-4">
          <div className={`px-6 py-2 rounded-xl border flex flex-col items-center min-w-24 transition-all
              ${stats.warnings > 0 ? 'bg-rose-500/10 border-rose-500/20 animate-pulse' : 'bg-white/5 border-white/10'}`}>
            <p className="text-[9px] font-black uppercase text-slate-400">קריאות</p>
            <p className={`text-lg font-black ${stats.warnings > 0 ? 'text-rose-500' : 'text-white'}`}>{stats.warnings}</p>
          </div>
        </div>
      </div>
    }
  >
    {/* גוף העמוד - משתנה לפי הניווט ב-Header */}
    <div className="w-full h-full animate-in fade-in duration-500" dir="rtl">
      {activeMainTab === 'dashboard' && (
        <OverviewTab stats={stats} onNavigate={setActiveMainTab} />
      )}

      {activeMainTab === 'rooms' && (
        <ViewClassroomsPage />
      )}

      {activeMainTab === 'logs' && (
        <LogsTab notifications={notifications} stats={stats} />
      )}
    </div>
  </DashboardLayout>
);
}