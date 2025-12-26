import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { attendanceHandlers } from '../../handlers/attendanceHandlers';
import { incidentHandlers } from '../../handlers/incidentHandlers';
import StudentGrid from '../../components/exam/StudentGrid';
import ExamTimer from '../../components/exam/ExamTimer';
import SidebarPanel from '../../components/exam/SidebarPanel';

export default function SupervisorDashboard() {
  const { examId } = useParams();
  
  // States
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bot'); // bot | chat | notifications
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initial Data Load
  useEffect(() => {
    attendanceHandlers.initConsole(examId, setStudents, setLoading);
  }, [examId]);

  // Handlers
  const handleStatusChange = async (id, status) => {
    await attendanceHandlers.changeStudentStatus(id, status, setStudents);
  };

  const addStudent = () => {
    const name = prompt("הכנס שם סטודנט:");
    const id = prompt("הכנס תעודת זהות:");
    if (name && id) {
      setStudents(prev => [...prev, { 
        id, 
        name, 
        status: 'במבחן', 
        desk: prev.length + 1 
      }]);
    }
  };

  const removeStudent = () => {
    const id = prompt("הכנס תעודת זהות של הסטודנט להסרה:");
    if (id) {
      const studentExists = students.find(s => s.id === id);
      if (studentExists) {
        if (window.confirm(`האם אתה בטוח שברצונך להסיר את ${studentExists.name}?`)) {
          setStudents(prev => prev.filter(s => s.id !== id));
        }
      } else {
        alert("סטודנט לא נמצא במערכת");
      }
    }
  };

  // Stats calculation
  const stats = {
    total: students.length,
    submitted: students.filter(s => s.status === 'סיים').length,
    inRoom: students.filter(s => s.status === 'במבחן').length,
    out: students.filter(s => s.status === 'שירותים').length
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-slate-300 italic animate-pulse">
      טוען נתונים...
    </div>
  );

  return (
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden font-sans text-right" dir="rtl">
      
      {/* --- Sidebar Structure --- */}
      <div className="flex shrink-0 shadow-2xl z-40">
        <nav className="w-20 bg-[#0f172a] flex flex-col items-center py-8 gap-8 border-l border-slate-800">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl mb-4 shadow-lg shadow-blue-900/20 italic">
            EX
          </div>
          
          <div className="flex flex-col gap-6 flex-1">
            <NavIcon 
              icon="🤖" 
              active={activeTab === 'bot'} 
              onClick={() => {setActiveTab('bot'); setIsSidebarOpen(true)}} 
              label="ExamBot"
            />
            <NavIcon 
              icon="💬" 
              active={activeTab === 'chat'} 
              onClick={() => {setActiveTab('chat'); setIsSidebarOpen(true)}} 
              label="צ'אט"
            />
            <NavIcon 
              icon="🔔" 
              active={activeTab === 'notifications'} 
              onClick={() => {setActiveTab('notifications'); setIsSidebarOpen(true)}} 
              label="התראות"
            />
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-3 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </nav>

        {isSidebarOpen && (
          <aside className="w-80 bg-white border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-50 flex flex-col gap-1">
              <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">מערכת ניטור</h2>
              <h3 className="text-lg font-black text-slate-800 italic">
                {activeTab === 'bot' && 'ExamBot Helper'}
                {activeTab === 'chat' && 'צ\'אט משגיחים'}
                {activeTab === 'notifications' && 'יומן התראות'}
              </h3>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <SidebarPanel activeTab={activeTab} />
            </div>
          </aside>
        )}
      </div>

      {/* --- Main Dashboard Area --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <header className="bg-white border-b border-slate-100 px-8 py-6 flex justify-between items-center z-30 shadow-sm">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800 leading-none tracking-tight">Supervisor Dashboard</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                  חדר 302 | מזהה מבחן: {examId}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <button 
              onClick={() => incidentHandlers.handleCallManager(examId, "302")} 
              className="bg-[#fffbeb] text-[#92400e] px-8 py-4 rounded-[22px] text-lg font-black border-2 border-[#fde68a] hover:bg-[#fef3c7] transition-all active:scale-95 flex items-center gap-3"
            >
              קריאה למשגיח קומה
              <span className="w-3 h-3 bg-[#f59e0b] rounded-full animate-pulse"></span>
            </button>
            
            <div className="scale-125 mx-4 shrink-0">
              <ExamTimer initialSeconds={5391} onTimeUp={() => {}} />
            </div>

            <button className="bg-[#0f172a] text-white px-10 py-4 rounded-[22px] text-lg font-black hover:bg-red-600 transition-all active:scale-95 shadow-xl shadow-slate-200">
              סיום מבחן
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 bg-[#f8fafc]">
          <div className="mb-12 flex flex-col gap-10">
            
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">ניהול חדר</h2>
                <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-wide">מבוא למדעי המחשב | ניטור נוכחות</p>
              </div>
              
              {/* כפתורי פעולה */}
              <div className="flex gap-4">
                <button 
                  onClick={removeStudent} 
                  className="bg-white text-red-600 border-2 border-red-50 px-6 py-4 rounded-[22px] font-black text-sm shadow-sm hover:bg-red-50 transition-all active:scale-95 flex items-center gap-3"
                >
                  <span className="text-xl">−</span> הסרת סטודנט
                </button>
                <button 
                  onClick={addStudent} 
                  className="bg-emerald-600 text-white px-8 py-4 rounded-[22px] font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-3"
                >
                  <span className="text-xl">+</span> הוספת סטודנט
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <StatCard label="סה״כ נרשמו" value={stats.total} color="slate" />
              <StatCard label="הגישו מבחן" value={stats.submitted} color="emerald" border />
              <StatCard label="נוכחים כעת" value={stats.inRoom} color="blue" />
              <StatCard label="נמצאים בחוץ" value={stats.out} color="amber" border />
            </div>
          </div>

          <div className="pb-20">
            <StudentGrid 
              students={students} 
              onStatusChange={handleStatusChange} 
              onMoveClass={(id) => alert(`העברת סטודנט ${id}`)} 
            />
          </div>
        </main>
      </div>
    </div>
  );
}

const NavIcon = ({ icon, active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`group relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 scale-110' 
        : 'text-slate-500 hover:text-white hover:bg-slate-800'
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span className="absolute right-full mr-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
      {label}
    </span>
  </button>
);

const StatCard = ({ label, value, color, border }) => {
  const colors = {
    slate: 'text-slate-800',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-500'
  };

  return (
    <div className={`bg-white p-7 rounded-4xl border border-slate-100 shadow-sm ${
      border ? `border-r-8 border-r-${color === 'emerald' ? 'emerald-500' : 'amber-400'}` : ''
    }`}>
      <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{label}</p>
      <p className={`text-4xl font-black ${colors[color]}`}>{value}</p>
    </div>
  );
};