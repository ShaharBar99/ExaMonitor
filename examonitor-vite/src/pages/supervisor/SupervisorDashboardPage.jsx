import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceHandlers } from '../../handlers/attendanceHandlers';
import { incidentHandlers } from '../../handlers/incidentHandlers';
import { timerHandlers } from '../../handlers/timerHandlers';
import Sidebar from '../../components/layout/Sidebar';
import SidebarPanel from '../../components/exam/SidebarPanel';
import StudentGrid from '../../components/exam/StudentGrid';
import ExamTimer from '../../components/exam/ExamTimer';
import { useExam } from '../../state/ExamContext';

export default function SupervisorDashboard() {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  // --- Context ---
  const { examData, setExamData } = useExam();

  // --- States ---
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bot');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [remainingTime, setRemainingTime] = useState(null); // התחלנו כ-null כדי לדעת מתי הסנכרון הסתיים

  // --- Initial Data Load ---
  useEffect(() => {
    // טעינת סטודנטים ועדכון נתוני המבחן בקונטקסט
    attendanceHandlers.initConsole(examId, setStudents, setLoading, setExamData);
  }, [examId, setExamData]);

  useEffect(() => {
    const loadTime = async () => {
      try {
        const seconds = await timerHandlers.getRemainingSeconds(examId);
        setRemainingTime(seconds);
      } catch (error) {
        console.error("Failed to load time:", error);
      }
    };
    loadTime();
  }, [examId]);

  // --- Handlers ---
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

  const handleFinishExam = async () => {
    const confirmed = window.confirm("האם אתה בטוח שברצונך לסיים את המבחן? פעולה זו תנעל את הגישה.");
    if (confirmed) {
      try {
        // כאן אפשר להוסיף קריאת API לסיום המבחן
        alert("המבחן הסתיים בהצלחה. המערכת נועלת נתונים.");
        navigate('/select-exam');
      } catch (error) {
        alert("שגיאה בסיום המבחן");
      }
    }
  };

  // --- Stats Calculation ---
  const stats = {
    total: students.length,
    submitted: students.filter(s => s.status === 'סיים').length,
    inRoom: students.filter(s => s.status === 'במבחן').length,
    out: students.filter(s => s.status === 'שירותים').length
  };

  const tabs = [
    { id: 'bot', icon: '🤖', label: 'ExamBot Helper' },
    { id: 'chat', icon: '🏢', label: "קשר למשגיח קומה" },
    { id: 'notifications', icon: '🔔', label: 'יומן התראות' }
  ];

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <div className="font-black text-slate-400 italic tracking-widest uppercase">Initializing Room Control...</div>
    </div>
  );

  return (
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden font-sans text-right" dir="rtl">
      
      <Sidebar 
        tabs={tabs} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        logoText="EX"
        logoColor="bg-blue-600"
      >
        <SidebarPanel activeTab={activeTab} userRole="supervisor" />
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header מעודכן */}
        <header className="bg-white border-b border-slate-100 px-8 py-6 flex justify-between items-center z-30 shadow-sm">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800 leading-none tracking-tight uppercase italic">Room Control</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                  ROOM ID: {examId} | {examData?.room || 'BLDG A'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => incidentHandlers.handleCallManager(examId, examData?.room || "302")} 
              className="bg-[#fffbeb] text-[#92400e] px-6 py-4 rounded-[22px] text-sm font-black border-2 border-[#fde68a] hover:bg-[#fef3c7] transition-all flex items-center gap-2 active:scale-95 shadow-sm"
            >
              קריאה למנהל קומה
              <span className="w-2 h-2 bg-[#f59e0b] rounded-full animate-bounce"></span>
            </button>

            <button 
              onClick={() => navigate(`/exam/incident-report/${examId}`)}
              className="bg-rose-50 text-rose-600 px-6 py-4 rounded-[22px] text-sm font-black border-2 border-rose-100 hover:bg-rose-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
            >
              ⚠️ דיווח חריג
            </button>
            
            <div className="mx-4 shrink-0">
              {remainingTime !== null && (
                <ExamTimer initialSeconds={remainingTime} onTimeUp={() => alert("הזמן הסתיים!")} />
              )}
            </div>

            <button 
              onClick={handleFinishExam}
              className="bg-[#0f172a] text-white px-8 py-4 rounded-[22px] text-sm font-black hover:bg-red-600 transition-all active:scale-95"
            >
              סיום מבחן
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 bg-[#f8fafc]">
          <div className="mb-12 flex flex-col gap-10">
            
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">ניהול חדר בחינה</h2>
                <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-wide">
                  {examData?.name || 'מבוא למדעי המחשב'} | ניטור נוכחות
                </p>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={removeStudent} 
                  className="bg-white text-red-600 border-2 border-red-50 px-6 py-4 rounded-[22px] font-black text-sm shadow-sm hover:bg-red-50 transition-all active:scale-95"
                >
                  הסרת סטודנט
                </button>
                <button 
                  onClick={addStudent} 
                  className="bg-emerald-600 text-white px-8 py-4 rounded-[22px] font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                >
                  הוספת סטודנט
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <StatCard label="סה״כ רשומים" value={stats.total} color="slate" />
              <StatCard label="הגישו מבחן" value={stats.submitted} color="emerald" border />
              <StatCard label="נוכחים כעת" value={stats.inRoom} color="blue" />
              <StatCard label="בחוץ / שירותים" value={stats.out} color="amber" border />
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

const StatCard = ({ label, value, color, border }) => {
  const colors = {
    slate: 'text-slate-800',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-500'
  };

  const borderColors = {
    emerald: 'border-r-emerald-500',
    amber: 'border-r-amber-400'
  };

  return (
    <div className={`bg-white p-7 rounded-[35px] border border-slate-100 shadow-sm ${
      border ? `border-r-8 ${borderColors[color]}` : ''
    }`}>
      <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{label}</p>
      <p className={`text-4xl font-black ${colors[color]}`}>{value}</p>
    </div>
  );
};