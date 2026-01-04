import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// רכיבי תשתית
import Sidebar from '../../components/layout/Sidebar';
import SidebarPanel from '../../components/exam/SidebarPanel';
// לוגיקה ונתונים
import { notificationHandlers } from '../../handlers/notificationHandlers';
import { INITIAL_ROOMS, AVAILABLE_SUPERVISORS } from '../../mocks/floorSupervisor_MockData';
import { useExam } from '../state/ExamContext';

export default function FloorSupervisorDashboardPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { examData } = useExam();

  // ניהול מצב (State)
  const [rooms] = useState(INITIAL_ROOMS);
  const [activeTab, setActiveTab] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  // טעינת נתונים מסונכרנת
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        await notificationHandlers.loadNotifications('floor_3', 
          (data) => { if(isMounted) setNotifications(data); }, 
          (loading) => { if(isMounted) setIsLoadingNotifications(loading); }
        );
      } catch (error) {
        console.error("שגיאה בסנכרון נתונים:", error);
      } finally {
        setTimeout(() => { if(isMounted) setIsLoadingNotifications(false); }, 1000);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [examId]);

  // חישוב סטטיסטיקות (Memoized למניעת חישובים מיותרים)
  const stats = useMemo(() => ({
    activeRooms: rooms.filter(r => r.status === 'active').length,
    warnings: rooms.filter(r => r.status === 'warning').length,
    totalStudents: rooms.reduce((acc, curr) => acc + curr.studentsCount, 0),
    supervisorsOnFloor: AVAILABLE_SUPERVISORS.length
  }), [rooms]);

  const tabs = [
    { id: 'chat', icon: '👥', label: "צ'אט צוות" },
    { id: 'lecturer', icon: '👨‍🏫', label: "קשר למרצה" },
    { id: 'notifications', icon: '📋', label: "יומן קומה" }
  ];

  if (isLoadingNotifications && notifications.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white font-black italic uppercase tracking-widest">
        מאתחל מערכת שליטה...
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#0f172a] overflow-hidden font-sans text-right text-white" dir="rtl">
      
      <Sidebar 
        tabs={tabs} 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        logoText="FM" logoColor="bg-indigo-600"
      >
        <SidebarPanel key={activeTab} activeTab={activeTab} userRole="floor_manager" />
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* כותרת עליונה */}
        <header className="bg-white/5 border-b border-white/10 px-12 py-8 flex justify-between items-center z-30 backdrop-blur-md">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                {examData?.courseName || 'מרכז שליטה קומתי'}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                  קומה {examData?.floor || '03'} • גזרה דלתא • סשן פעיל
                </p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/exam/view-classrooms', { state: { role: 'floor_manager' } })}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center gap-3"
            >
              <span>📱</span> פריסת חדרים
            </button>
          </div>

          <div className="flex gap-4">
            <StatHeader label="חדרים פעילים" value={stats.activeRooms} color="indigo" />
            <StatHeader label="קריאות דחופות" value={stats.warnings} color={stats.warnings > 0 ? "red" : "white"} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 bg-[#0f172a] space-y-10">
          
          {/* כרטיסי מידע ופעולות מהירות */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* כרטיס סטודנטים */}
            <div className="lg:col-span-1 bg-white/5 rounded-[45px] p-10 border border-white/10 flex flex-col justify-between hover:bg-white/[0.07] transition-colors group">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">סה"כ נבחנים בקומה</p>
                <h3 className="text-6xl font-black italic tracking-tighter group-hover:text-indigo-400 transition-colors tabular-nums">{stats.totalStudents}</h3>
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
                   <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">סטטוס סנכרון</span>
                   <span className="text-indigo-500 font-black italic">מחובר בזמן אמת</span>
              </div>
            </div>

            {/* פקודות מערכת */}
            <div className="lg:col-span-2 bg-indigo-600 rounded-[45px] p-10 shadow-2xl shadow-indigo-900/20 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black italic uppercase">פקודות מערכת</h3>
                <span className="text-white/30 font-mono text-[10px] tracking-widest italic">ערוץ מאובטח</span>
              </div>
              <div className="grid grid-cols-2 gap-6 text-right">
                <QuickActionButton icon="📢" label="הודעה לכל המשגיחים" color="bg-white/10 hover:bg-white text-white hover:text-indigo-600" />
                <QuickActionButton icon="🆘" label="קריאה דחופה לתמיכה" color="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20" />
              </div>
            </div>
          </div>

          {/* יומן אירועים מרכזי */}
          <div className="bg-white rounded-[50px] shadow-2xl border border-white/10 min-h-150 flex flex-col overflow-hidden relative">
            
            <div className="p-12 flex justify-between items-center border-b border-slate-50 bg-white">
              <div>
                <h2 className="text-4xl font-black text-[#0f172a] tracking-tight italic uppercase leading-none">יומן אירועים</h2>
                <p className="text-slate-400 font-bold text-[11px] mt-3 uppercase tracking-[0.2em]">התראות ודיווחים בזמן אמת מהחדרים</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3 space-x-reverse ml-4">
                  {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />)}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-500 flex items-center justify-center text-[10px] font-black">+{stats.supervisorsOnFloor - 3}</div>
                </div>
                <span className="px-5 py-2.5 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase italic border border-slate-100">סנכרון פעיל</span>
              </div>
            </div>

            <div className="flex-1 p-12 pt-6 overflow-y-auto">
              <div className="space-y-3">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <EventRow key={n.id} time={n.time} room={n.room} msg={n.message} type={n.type} />
                  ))
                ) : (
                  <div className="py-24 text-center border-2 border-dashed border-slate-50 rounded-[40px]">
                    <p className="text-slate-300 font-black italic uppercase tracking-widest">אין התראות רשומות כרגע</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- רכיבי עזר פנימיים (למניעת שכפול) ---

const StatHeader = ({ label, value, color }) => {
  const colors = {
    indigo: "text-indigo-400 border-indigo-400/20 bg-indigo-400/5",
    red: "text-rose-500 border-rose-500/20 bg-rose-500/10 animate-pulse",
    white: "text-white border-white/10 bg-white/5"
  };
  return (
    <div className={`px-8 py-4 rounded-2xl border transition-all ${colors[color]} flex flex-col items-center min-w-30`}>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">{label}</p>
      <p className="text-2xl font-black italic leading-none tabular-nums">{value}</p>
    </div>
  );
};

const QuickActionButton = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} className={`${color} p-8 rounded-[35px] flex items-center gap-6 transition-all active:scale-95 group relative overflow-hidden text-right`}>
    <span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
    <span className="text-xs font-black uppercase tracking-widest leading-tight">{label}</span>
  </button>
);

const EventRow = ({ time, room, msg, type }) => (
  <div className="group flex items-center justify-between py-6 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-8 rounded-[25px] transition-all">
    <div className="flex items-center gap-8">
      <span className="text-[11px] font-black text-slate-300 font-mono group-hover:text-indigo-500 transition-colors w-12">{time}</span>
      <div className="flex flex-col min-w-20">
        <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-tighter text-center">
          {room || "מערכת"}
        </span>
      </div>
      <p className={`text-base font-bold tracking-tight ${type === 'warning' ? 'text-rose-600' : 'text-slate-700'}`}>
        {msg}
      </p>
    </div>
    <div className="flex items-center gap-4">
       {type === 'warning' && (
         <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest animate-pulse">קריטי</span>
       )}
       <div className={`w-2.5 h-2.5 rounded-full ${type === 'warning' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-slate-200'}`}></div>
    </div>
  </div>
);