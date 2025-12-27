import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import SidebarPanel from '../../components/exam/SidebarPanel';
import { INITIAL_ROOMS, AVAILABLE_SUPERVISORS } from '../../mocks/floorSupervisor_MockData';

export default function FloorSupervisorDashboardPage() {
  const navigate = useNavigate();

  // --- States ---
  const [rooms] = useState(INITIAL_ROOMS);
  const [activeTab, setActiveTab] = useState('chat'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- חישוב נתונים ללוח הבקרה ---
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
      
      {/* 1. Sidebar */}
      <Sidebar 
        tabs={tabs} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        logoText="FM"
        logoColor="bg-indigo-600"
      >
        <SidebarPanel activeTab={activeTab} userRole="floor_manager" />
      </Sidebar>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-12 py-8 flex justify-between items-center z-30 shadow-sm">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-3xl font-black text-slate-800 italic tracking-tight leading-none uppercase">Floor Management</h1>
              <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-[11px] flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                מרכז בקרה קומות 3-4
              </p>
            </div>

            <div className="flex gap-3">
                <button 
                  onClick={() => navigate('/exam/view-classrooms', { state: { role: 'floor_manager' } })}
                  className="flex items-center gap-3 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  <span className="text-xl">📱</span>
                  פריסת חדרים
                </button>

                {/* כפתור דיווח אירוע חריג - בולט למשגיח */}
                <button 
                  onClick={() => navigate('/exam/incident-report')}
                  className="flex items-center gap-3 bg-white border-2 border-rose-100 text-rose-600 px-6 py-4 rounded-2xl font-black text-sm hover:bg-rose-50 transition-all active:scale-95"
                >
                  <span className="text-xl">⚠️</span>
                  דיווח חריג
                </button>
            </div>
          </div>

          <div className="flex gap-4">
            <StatHeader label="חדרים פעילים" value={stats.activeRooms} color="indigo" />
            <StatHeader label="קריאות פתוחות" value={stats.warnings} color={stats.warnings > 0 ? "red" : "slate"} />
            <StatHeader label="משגיחים" value={stats.supervisorsOnFloor} color="slate" />
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-12 bg-[#f8fafc] flex flex-col gap-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* כרטיס סיכום מצב קומה */}
            <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm flex flex-col justify-between">
              <h3 className="text-2xl font-black text-slate-800 mb-6 italic">סטטוס נוכחות כללי</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="font-bold text-slate-500 uppercase text-[11px] tracking-wider">סה"כ סטודנטים בקומה</span>
                  <span className="text-3xl font-black text-slate-800">{stats.totalStudents}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-emerald-50 rounded-3xl border border-emerald-100">
                  <span className="font-bold text-emerald-600 uppercase text-[11px] tracking-wider">בחינות שהסתיימו</span>
                  <span className="text-3xl font-black text-emerald-700">2</span>
                </div>
              </div>
            </div>

            {/* כרטיס פעולות מהירות */}
            <div className="bg-[#0f172a] rounded-[40px] p-10 shadow-2xl text-white">
              <h3 className="text-2xl font-black mb-6 italic">פעולות ניהול מהירות</h3>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionButton icon="📢" label="הודעה לכל המשגיחים" color="bg-slate-800/50 hover:bg-indigo-600" />
                <QuickActionButton 
                    icon="⚠️" 
                    label="דיווח אירוע חדש" 
                    color="bg-rose-900/20 hover:bg-rose-600 border border-rose-500/20" 
                    onClick={() => navigate('/exam/incident-report')}
                />
                <QuickActionButton icon="🆘" label="קריאה לתמיכה" color="bg-red-900/40 hover:bg-red-900" />
                <QuickActionButton icon="⚙️" label="הגדרות" color="bg-slate-800/50 hover:bg-slate-700" />
              </div>
            </div>
          </div>

          {/* יומן אירועים אחרונים */}
          <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 italic">יומן אירועים - קומה 3</h3>
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">לכל היומן</button>
            </div>
            <div className="space-y-2">
              <EventRow time="12:45" room="302" msg="סטודנט יצא לשירותים" type="info" />
              <EventRow time="12:40" room="401" msg="קריאה למנהל קומה - נדרש סיוע" type="warning" />
              <EventRow time="12:35" room="305" msg="הודעה חדשה מהמרצה" type="msg" />
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

// --- רכיבי עזר פנימיים ---

const StatHeader = ({ label, value, color }) => {
  const colorMap = {
    indigo: 'text-indigo-600',
    red: 'text-red-500 animate-pulse',
    slate: 'text-slate-800'
  };
  return (
    <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center min-w-30">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{label}</p>
      <p className={`text-2xl font-black leading-none ${colorMap[color] || 'text-slate-800'}`}>{value}</p>
    </div>
  );
};

const QuickActionButton = ({ icon, label, color, onClick }) => (
  <button 
    onClick={onClick}
    className={`${color} p-6 rounded-[30px] flex flex-col items-center justify-center gap-3 transition-all border border-white/5 active:scale-95`}
  >
    <span className="text-2xl">{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-tight text-center leading-tight">{label}</span>
  </button>
);

const EventRow = ({ time, room, msg, type }) => (
  <div className="flex items-center justify-between py-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-4 rounded-2xl transition-colors">
    <div className="flex items-center gap-6">
      <span className="text-[11px] font-black text-slate-300 tabular-nums">{time}</span>
      <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 border border-slate-200">חדר {room}</span>
      <span className={`text-sm font-bold ${type === 'warning' ? 'text-red-600' : 'text-slate-700'}`}>{msg}</span>
    </div>
    <div className={`w-2 h-2 rounded-full ${type === 'warning' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-200'}`}></div>
  </div>
);