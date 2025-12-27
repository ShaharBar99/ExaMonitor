import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import SidebarPanel from '../../components/exam/SidebarPanel';
import { notificationHandlers } from '../../handlers/notificationHandlers';
import { INITIAL_ROOMS, AVAILABLE_SUPERVISORS } from '../../mocks/floorSupervisor_MockData';
import { useExam } from '../../state/ExamContext'; // ייבוא הקונטקסט

export default function FloorSupervisorDashboardPage() {
  const { examId } = useParams(); // קבלת ה-ID מה-URL
  const navigate = useNavigate();
  
  // --- Context ---
  const { examData } = useExam(); // שליפת נתוני המבחן הכלליים

  // --- States ---
  const [rooms] = useState(INITIAL_ROOMS);
  const [activeTab, setActiveTab] = useState('chat'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  // --- אפקט טעינת התראות קומה ---
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // טעינת התראות עבור הקומה הרלוונטית (למשל קומה 3)
        await notificationHandlers.loadNotifications('floor_3', 
          (data) => { if(isMounted) setNotifications(data); }, 
          (loading) => { if(isMounted) setIsLoadingNotifications(loading); }
        );
      } catch (error) {
        console.error("Failed to load floor notifications:", error);
      } finally {
        // מנגנון הגנה לשחרור הטעינה
        setTimeout(() => {
          if(isMounted) setIsLoadingNotifications(false);
        }, 1000);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [examId]);

  // --- חישוב נתונים סטטיסטיים ---
  const stats = {
    activeRooms: rooms.filter(r => r.status === 'active').length,
    warnings: rooms.filter(r => r.status === 'warning').length,
    totalStudents: rooms.reduce((acc, curr) => acc + curr.studentsCount, 0),
    supervisorsOnFloor: AVAILABLE_SUPERVISORS.length
  };

  const tabs = [
    { id: 'chat', icon: '👥', label: "צ'אט צוות" },
    { id: 'lecturer', icon: '👨‍🏫', label: "קשר למרצה" },
    { id: 'notifications', icon: '📋', label: "יומן קומה" }
  ];

  return (
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden font-sans text-right" dir="rtl">
      
      {/* Sidebar עם ה-Panel שכולל את הצ'אטים */}
      <Sidebar 
        tabs={tabs} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        logoText="FM"
        logoColor="bg-indigo-600"
      >
        <SidebarPanel 
          key={activeTab} 
          activeTab={activeTab} 
          userRole="floor_manager" 
        />
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - משתמש בנתונים מה-Context */}
        <header className="bg-white border-b border-slate-100 px-12 py-8 flex justify-between items-center z-30 shadow-sm">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-3xl font-black text-slate-800 italic uppercase tracking-tight leading-none">
                {examData?.courseName || 'Floor Management'}
              </h1>
              <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-[11px] flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                מזהה מבחן: {examId} | קומה {examData?.floor || '3-4'}
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/exam/view-classrooms', { state: { role: 'floor_manager' } })}
                className="flex items-center gap-3 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
              >
                📱 פריסת חדרים
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <StatHeader label="חדרים פעילים" value={stats.activeRooms} color="indigo" />
            <StatHeader label="קריאות פתוחות" value={stats.warnings} color={stats.warnings > 0 ? "red" : "slate"} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 bg-[#f8fafc] flex flex-col gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* כרטיס סטטוס נוכחות */}
            <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-black text-slate-800 mb-6 italic">סטטוס נוכחות כללי</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="font-bold text-slate-500 uppercase text-[11px]">סה"כ סטודנטים בקומה</span>
                  <span className="text-3xl font-black text-slate-800">{stats.totalStudents}</span>
                </div>
              </div>
            </div>

            {/* כרטיס פעולות מהירות */}
            <div className="bg-[#0f172a] rounded-[40px] p-10 shadow-2xl text-white">
              <h3 className="text-2xl font-black mb-6 italic">פעולות מהירות</h3>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionButton icon="📢" label="הודעה לכל המשגיחים" color="bg-slate-800/50 hover:bg-indigo-600" />
                <QuickActionButton icon="🆘" label="קריאה לתמיכה" color="bg-red-900/40 hover:bg-red-900" />
              </div>
            </div>
          </div>

          {/* יומן אירועים (התראות) */}
          <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm flex-1">
            <h3 className="text-2xl font-black text-slate-800 mb-8 italic">יומן אירועים אחרונים</h3>
            <div className="space-y-2">
              {isLoadingNotifications ? (
                <div className="text-slate-300 font-black animate-pulse py-4">טוען יומן אירועים...</div>
              ) : notifications.length > 0 ? (
                notifications.slice(0, 8).map(n => (
                  <EventRow key={n.id} time={n.time} room={n.room} msg={n.message} type={n.type} />
                ))
              ) : (
                <div className="text-slate-400 font-bold italic py-4 text-center border-2 border-dashed border-slate-50 rounded-3xl">
                  אין אירועים חריגים בקומה כרגע
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- רכיבי עזר פנימיים ---

const StatHeader = ({ label, value, color }) => (
  <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[120px]">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-2xl font-black ${color === 'red' ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>{value}</p>
  </div>
);

const QuickActionButton = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} className={`${color} p-6 rounded-[30px] flex flex-col items-center justify-center gap-3 transition-all active:scale-95 border border-white/5`}>
    <span className="text-2xl">{icon}</span>
    <span className="text-[10px] font-black uppercase text-center leading-tight">{label}</span>
  </button>
);

const EventRow = ({ time, room, msg, type }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-6 rounded-2xl transition-colors">
    <div className="flex items-center gap-6">
      <span className="text-[11px] font-black text-slate-300 font-mono">{time}</span>
      <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase">חדר {room || "כללי"}</span>
      <span className={`text-sm font-bold ${type === 'warning' ? 'text-red-600' : 'text-slate-700'}`}>{msg}</span>
    </div>
    <div className={`w-2.5 h-2.5 rounded-full ${type === 'warning' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'bg-slate-200'}`}></div>
  </div>
);