import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { attendanceHandlers } from '../../handlers/attendanceHandlers';
import { incidentHandlers } from '../../handlers/incidentHandlers';
import { timerHandlers } from '../../handlers/timerHandlers';
import { examHandlers } from '../../handlers/examHandlers';
import Sidebar from '../layout/Sidebar';
import SidebarPanel from '../exam/SidebarPanel';
import StudentGrid from './StudentGrid';
import ExamTimer from '../exam/ExamTimer';
import { useExam } from '../state/ExamContext';
import StatCard from '../exam/StatCard';
import {HeaderButton} from '../shared/Button';
import ExamChecklist from '../exam/ExamChecklist';

export default function SupervisorDashboard() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { examData, setExamData } = useExam();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bot');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [remainingTime, setRemainingTime] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  
  const [isRemoveBarOpen, setIsRemoveBarOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', id: '' });
  const [removeSearchQuery, setRemoveSearchQuery] = useState('');

  useEffect(() => {
    attendanceHandlers.initConsole(examId, setStudents, setLoading, setExamData);
  }, [examId, setExamData]);

  useEffect(() => {
    if (location.state?.classrooms) {
      setClassrooms(location.state.classrooms);
    }
  }, [location.state]);

  useEffect(() => {
    const syncTime = async () => {
      const seconds = await timerHandlers.getRemainingSeconds(examId);
      setRemainingTime(seconds);
    };
    syncTime();
    const interval = setInterval(syncTime, 60000);
    return () => clearInterval(interval);
  }, [examId]);

  const filteredForRemoval = useMemo(() => {
    if (!removeSearchQuery || removeSearchQuery.length < 2) return [];
    return students.filter(s => 
      s.id.includes(removeSearchQuery) || 
      s.name.toLowerCase().includes(removeSearchQuery.toLowerCase())
    ).slice(0, 3);
  }, [students, removeSearchQuery]);

  const handleStatusChange = async (id, status) => {
    await attendanceHandlers.changeStudentStatus(id, status, setStudents);
  };

  const handleStartExam = async () => {
    // עדכון סטטוס ב-DB ל-'active' דרך ה-Handler
    await examHandlers.handleChangeStatus(examId, 'active', setExamData);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.id) return;
    const studentToAdd = { ...newStudent, status: 'במבחן', id: newStudent.id.toString() };
    setStudents(prev => [...prev, studentToAdd]);
    setNewStudent({ name: '', id: '' });
  };

  const confirmRemoval = (student) => {
    if (window.confirm(`להסיר את ${student.name} מהמבחן?`)) {
      setStudents(prev => prev.filter(s => s.id !== student.id));
      setRemoveSearchQuery('');
      setIsRemoveBarOpen(false);
    }
  };

  const handleFinishExam = async () => {
    if (window.confirm("האם אתה בטוח שברצונך לסיים את המבחן לכולם?")) {
      await examHandlers.handleChangeStatus(examId, 'finished', setExamData);
      navigate('/select-exam');
    }
  };

  const stats = {
    total: students.length,
    submitted: students.filter(s => s.status === 'סיים').length,
    inRoom: students.filter(s => s.status === 'במבחן').length,
    out: students.filter(s => s.status === 'שירותים').length
  };
  const handleChecklistComplete = async () => {
    try {
        const response = await examHandlers.handleChangeStatus(examId, 'active', setExamData);
   
    } catch (error) {
        console.error("Failed to start exam:", error);
        alert("שגיאה בהפעלת המבחן");
    }
};

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white font-black uppercase tracking-widest animate-pulse">
        Initializing System...
    </div>
  );

  return (
    <div className="h-screen flex bg-[#0f172a] overflow-hidden text-right font-sans" dir="rtl">
      
      <Sidebar 
        tabs={[{ id: 'bot', icon: '🤖', label: 'ExamBot' }, { id: 'chat', icon: '🏢', label: "קשר" }]} 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} 
        logoText="EX" logoColor="bg-emerald-600"
      >
        <SidebarPanel activeTab={activeTab} userRole="supervisor" />
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        <header className="bg-white/5 border-b border-white/10 px-10 py-8 flex justify-between items-center z-30 backdrop-blur-md">
          <div className="flex items-center gap-8 text-white">
            <div>
              <h1 className="text-3xl font-black leading-none tracking-tight uppercase">Room Control</h1>
              <div className="flex items-center gap-3 mt-3">
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${examData?.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                   {examData?.roomName || 'SECURE WING'} • {examId} • {examData?.status === 'pending' ? 'בהמתנה' : 'בפעולה'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <HeaderButton onClick={() => incidentHandlers.handleCallManager(examId)} variant="warning" label="קריאה למנהל" icon="🆘" />
            <HeaderButton onClick={() => navigate(`/exam/incident-report/${examId}`)} variant="danger" label="דיווח חריג" icon="⚠️" />
            <div className="mx-6 px-6 border-x border-white/10 shrink-0">
              {remainingTime !== null && <ExamTimer initialSeconds={remainingTime} isPaused={examData?.status !== 'active'} />}
            </div>
            <button onClick={handleFinishExam} className="bg-white text-[#0f172a] px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-2xl">
              סיום מבחן
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 bg-[#0f172a] space-y-10">
          
          {/* לוגיקת הצגת צ'ק-ליסט או ניהול מבחן */}
          {examData?.status === 'pending' ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-700">
               <div className="text-center mb-12">
                  <h2 className="text-5xl font-black text-white mb-4 italic uppercase">Ready for Deployment?</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest">יש להשלים את הפרוטוקול לפני פתיחת השעון</p>
               </div>
               <ExamChecklist onComplete={handleStartExam} />
            </div>
          ) : (
            <>
              {/* כרטיסי סטטיסטיקה - מופיעים רק כשהמבחן פעיל */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
                <StatCard label="רשומים" value={stats.total} variant="default" icon="👥" />
                <StatCard label="הגישו" value={stats.submitted} variant="success" progress={(stats.submitted/stats.total)*100} icon="📝" />
                <StatCard label="בחדר" value={stats.inRoom} variant="info" icon="🏠" />
                <StatCard label="בחוץ" value={stats.out} variant="warning" highlight={stats.out > 0} icon="🚶" />
              </div>

              {/* קונטיינר הנוכחות המרכזי */}
              <div className="bg-white rounded-[50px] shadow-2xl border border-white/10 min-h-150 flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                
                {/* Removal Bar */}
                <div className={`absolute top-0 left-0 w-full z-40 transition-all duration-500 ease-in-out bg-rose-600 shadow-2xl ${isRemoveBarOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                    <div className="px-12 py-8 flex items-center gap-8">
                        <div className="flex-1 relative">
                            <input 
                                type="text" placeholder="הקלד שם או ת.ז להסרה מהירה..."
                                className="w-full bg-white/20 border-2 border-white/30 rounded-2xl py-4 px-8 text-white placeholder:text-rose-100 outline-none focus:bg-white/30 transition-all font-bold"
                                value={removeSearchQuery} onChange={(e) => setRemoveSearchQuery(e.target.value)}
                            />
                            {filteredForRemoval.length > 0 && (
                                <div className="absolute top-full mt-3 left-0 flex gap-4">
                                    {filteredForRemoval.map(student => (
                                        <button key={student.id} onClick={() => confirmRemoval(student)} className="bg-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-rose-100 hover:scale-105 transition-transform flex flex-col items-start min-w-45">
                                            <span className="font-black text-slate-800 text-sm">{student.name}</span>
                                            <span className="text-[10px] text-rose-500 font-bold uppercase mt-1">לחץ להסרה ✖</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button onClick={() => {setIsRemoveBarOpen(false); setRemoveSearchQuery('');}} className="text-white font-black text-xs uppercase tracking-widest hover:opacity-70 transition-opacity">ביטול</button>
                    </div>
                </div>

                <div className="p-12 flex flex-col gap-10 border-b border-slate-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-4xl font-black text-[#0f172a] tracking-tight uppercase">Attendance</h2>
                      <p className="text-slate-400 font-bold text-[11px] mt-2 uppercase tracking-[0.2em]">ניהול נוכחות פעילה בזמן אמת</p>
                    </div>
                    <button onClick={() => setIsRemoveBarOpen(true)} className="bg-rose-50 text-rose-500 px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border-2 border-rose-100 flex items-center gap-3">
                      <span className="text-lg">✖</span> הסרה מהירה
                    </button>
                  </div>

                  <form onSubmit={handleAddStudent} className="flex items-end gap-4 bg-slate-50 p-6 rounded-[30px] border border-slate-100">
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">שם מלא</label>
                      <input 
                        type="text" placeholder="ישראל ישראלי" 
                        className="w-full bg-white border-2 border-transparent focus:border-emerald-500 py-4 px-6 rounded-2xl outline-none font-bold text-[#0f172a] shadow-sm transition-all"
                        value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-2 tracking-widest">תעודת זהות</label>
                      <input 
                        type="text" placeholder="312345678" 
                        className="w-full bg-white border-2 border-transparent focus:border-emerald-500 py-4 px-6 rounded-2xl outline-none font-bold text-[#0f172a] shadow-sm transition-all"
                        value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})}
                      />
                    </div>
                    <button type="submit" className="bg-emerald-500 text-white px-10 py-4 h-14.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all">
                      הוסף סטודנט
                    </button>
                  </form>
                </div>

                <div className="flex-1 p-12 pt-0 overflow-y-auto">
                  <StudentGrid students={students} onStatusChange={handleStatusChange} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}