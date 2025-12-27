import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import SidebarPanel from '../../components/exam/SidebarPanel';
import ExamTimer from '../../components/exam/ExamTimer';

export default function LecturerDashboardPage() {
  const navigate = useNavigate();
  
  // --- States ---
  const [activeTab, setActiveTab] = useState('floor_chat'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // נתונים מורחבים למרצה
  const examStats = { 
    title: "מבוא למדעי המחשב", 
    code: "CS101", 
    totalStudents: 145, 
    submitted: 32, 
    activeRooms: 5, 
    flaggedIncidents: 1,
    averageProgress: 45 // אחוז התקדמות ממוצע בבחינה
  };

  const tabs = [
    { id: 'floor_chat', icon: '🏢', label: 'משגיח קומה' },
    { id: 'notifications', icon: '🔔', label: 'התראות ויומן' },
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
        logoText="LT"
        logoColor="bg-rose-600"
      >
        <SidebarPanel activeTab={activeTab} userRole="lecturer" />
      </Sidebar>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-12 py-8 flex justify-between items-center z-30 shadow-sm">
          <div className="flex items-center gap-10">
            <div>
              <h1 className="text-3xl font-black text-slate-800 italic uppercase leading-none">Lecturer Console</h1>
              <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-[11px] flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                {examStats.title} ({examStats.code})
              </p>
            </div>

            {/* כפתור מעבר למבט כיתות (GRID) */}
            <button 
              onClick={() => navigate('/exam/view-classrooms', { state: { role: 'lecturer' } })}
              className="flex items-center gap-3 bg-white border-2 border-rose-100 text-rose-600 px-6 py-4 rounded-2xl font-black text-sm hover:bg-rose-50 transition-all shadow-sm active:scale-95"
            >
              <span className="text-xl">📊</span>
              מעקב כלל הכיתות
            </button>
          </div>

          <div className="flex items-center gap-8">
            <div className="scale-110">
              <ExamTimer initialSeconds={7200} />
            </div>
            <button className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-rose-700 shadow-lg shadow-rose-100 active:scale-95 transition-all">
              פרסום הודעה לכל החדרים
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-12 bg-[#f8fafc] space-y-8">
          
          {/* שורת סטטיסטיקה עם כפתור דוחות */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end px-2">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">מצב בחינה בזמן אמת</h3>
                <button className="text-xs font-black text-rose-600 hover:underline">הפקת דוח בחינה מלא (PDF)</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="סה״כ נבחנים" value={examStats.totalStudents} color="slate" />
              <StatCard label="הגישו בפועל" value={examStats.submitted} color="emerald" progress={(examStats.submitted/examStats.totalStudents)*100} />
              <StatCard label="חדרים פעילים" value={examStats.activeRooms} color="blue" />
              <StatCard label="אירועים חריגים" value={examStats.flaggedIncidents} color="rose" highlight />
            </div>
          </div>

          {/* אזור מרכזי: שאלות וקבצים */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* שאלות מהחדרים */}
            <div className="lg:col-span-2 bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 italic">שאלות ממתינות מהסטודנטים</h3>
                <div className="flex gap-2">
                    <span className="px-4 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase">דחוף (1)</span>
                    <span className="px-4 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase">סה"כ 2</span>
                </div>
              </div>
              
              <div className="space-y-4 flex-1">
                <QuestionRow 
                  room="302" 
                  student="ישראל ישראלי" 
                  question="האם בשאלה 4 הכוונה למערך דו-מימדי או רשימה?" 
                  time="12:10" 
                />
                <QuestionRow 
                  room="405" 
                  student="מיכל כהן" 
                  question="חסר נתון לגבי קבוע הגרביטציה בסעיף ב'" 
                  time="12:05"
                  isUrgent
                />
              </div>
            </div>

            {/* ניהול קבצים ונספחים */}
            <div className="bg-[#0f172a] rounded-[40px] p-10 shadow-2xl text-white flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black italic">נספחים</h3>
                <span className="text-[20px]">📂</span>
              </div>
              <div className="space-y-4 flex-1">
                <FileItem name="טופס בחינה - מקור.pdf" size="1.2MB" />
                <FileItem name="דף נוסחאות מאושר.pdf" size="450KB" />
              </div>
              <button className="w-full py-5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all mt-6 active:scale-95">
                העלאת נספח חדש לכל החדרים
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

// --- רכיבי עזר ---

const StatCard = ({ label, value, color, progress, highlight }) => {
  const colorClasses = {
    slate: 'text-slate-800',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    rose: 'text-rose-600'
  };

  return (
    <div className={`bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${highlight ? 'border-rose-200 ring-4 ring-rose-50' : ''}`}>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-black ${highlight ? 'animate-pulse' : ''} ${colorClasses[color]}`}>{value}</span>
        {progress && <span className="text-xs font-bold text-slate-300">({Math.round(progress)}%)</span>}
      </div>
      {progress && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-50">
          <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
};

const QuestionRow = ({ room, student, question, time, isUrgent }) => (
  <div className={`p-6 rounded-[28px] border-2 transition-all hover:scale-[1.01] ${isUrgent ? 'bg-rose-50/40 border-rose-100 shadow-sm' : 'bg-slate-50/50 border-transparent hover:border-slate-100'}`}>
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-xl text-[10px] font-black shadow-sm border ${isUrgent ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-800 border-slate-100'}`}>
            חדר {room}
        </span>
        <span className="text-xs font-bold text-slate-500">{student}</span>
      </div>
      <span className="text-[10px] font-bold text-slate-400 tabular-nums">{time}</span>
    </div>
    <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">{question}</p>
    <div className="flex gap-3">
      <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 transition-all active:scale-95 shadow-lg shadow-slate-200">השב עכשיו</button>
      <button className="px-6 py-2 bg-white text-slate-400 rounded-xl text-[10px] font-black uppercase border border-slate-200 hover:text-slate-600 transition-all">סמן כטופל</button>
    </div>
  </div>
);

const FileItem = ({ name, size }) => (
  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
    <div className="flex items-center gap-4">
      <span className="text-xl group-hover:rotate-12 transition-transform">📄</span>
      <div>
        <p className="text-xs font-bold text-slate-200">{name}</p>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{size}</p>
      </div>
    </div>
    <span className="text-slate-600 group-hover:text-white transition-colors">📥</span>
  </div>
);