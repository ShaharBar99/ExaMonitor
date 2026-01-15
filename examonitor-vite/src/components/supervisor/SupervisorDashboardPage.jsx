import React, { useEffect, useState, useMemo, useRef } from 'react';
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
import { useAuth } from '../state/AuthContext';
import StatCard from '../exam/StatCard';
import { HeaderButton } from '../shared/Button';
import AdmissionScanner from './AdmissionScanner';
import IncidentReportPage from './IncidentReportPage';

const PROTOCOL_STEPS = [
  { 
    id: 'bags', 
    text: "שלב 1: וודא שכל התיקים והטלפונים מונחים בחזית הכיתה כשהם כבויים. האם סיימת?", 
    options: [{ label: "בוצע, התיקים הונחו", action: "NEXT_STEP" }] 
  },
  { 
    id: 'ids', 
    text: "שלב 2: בדוק תעודות מזהות של כל הסטודנטים. ניתן להשתמש בסורק לקליטה מהירה.", 
    options: [{ label: "הבדיקה הסתיימה", action: "NEXT_STEP" }] 
  },
  { 
    id: 'forms', 
    text: "שלב 3: חלוקת טפסי הבחינה. האם כל הסטודנטים קיבלו טפסים?", 
    options: [{ label: "כן, חילקתי לכולם", action: "FINISH_PROTOCOL" }] 
  }
];

export default function SupervisorDashboard() {
  const { examId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { examData, setExamData } = useExam();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bot');
  const [dashboardTab, setDashboardTab] = useState('attendance'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [remainingTime, setRemainingTime] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  
  const [botMsg, setBotMsg] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const alertedStudents = useRef(new Set());
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [isRemoveBarOpen, setIsRemoveBarOpen] = useState(false);
  const [removeSearchQuery, setRemoveSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);

  const lastScannedId = useRef(null);
  const scanLock = useRef(false);

  // --- כל הלוגיקה המקורית (ללא שינוי) ---
  useEffect(() => {
    attendanceHandlers.initSupervisorConsole(examId, user.id, setStudents, setLoading, setExamData);
  }, [examId, user.id, setExamData]);

  useEffect(() => {
    if(user.role !== 'supervisor') navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (location.state?.classrooms) {
      setClassrooms(location.state.classrooms[0]);
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

  useEffect(() => {
    if (examData?.status === 'pending' && currentStep === 0 && !botMsg) {
      setBotMsg(PROTOCOL_STEPS[0]);
    }
  }, [examData, currentStep, botMsg]);

  useEffect(() => {
    const monitorInterval = setInterval(() => {
      const now = new Date();
      students.forEach(student => {
        if (student.status === 'exited_temporarily' && student.last_exit_time) {
          const exitTime = new Date(student.last_exit_time);
          const diffInMinutes = (now - exitTime) / 60000;
          if (diffInMinutes > 15 && !alertedStudents.current.has(student.id)) {
            setBotMsg({
              text: `⚠️ אזהרת בטיחות: הסטודנט ${student.name} (ת"ז: ${student.id}) נמצא בחוץ מעל 15 דקות! נא לבדוק את מצבו.`,
              isAlert: true
            });
            alertedStudents.current.add(student.id);
          }
        }
        if (student.status === 'present' && alertedStudents.current.has(student.id)) {
          alertedStudents.current.delete(student.id);
        }
      });
      if (remainingTime <= 600 && remainingTime > 540) {
         setBotMsg({
           text: "📢 שימו לב: נותרו 10 דקות לסיום המבחן. נא להכריז על כך בכיתה.",
           isAlert: true
         });
      }
    }, 15000);
    return () => clearInterval(monitorInterval);
  }, [students, remainingTime]);

  const handleScanResult = async (scannedId) => {
    if (scanLock.current || scannedId === lastScannedId.current) return;
    scanLock.current = true;
    lastScannedId.current = scannedId;

    const student = students.find(s => s.student_id === scannedId || s.id === scannedId || s.studentId === scannedId);
    
    if (student) {
      if (student.status === 'absent' || !student.status) {
        await handleStatusChange(student.id, 'במבחן');
        setBotMsg({ text: `✅ כניסה למבחן: ${student.name}` });
      } else if (student.status === 'present') {
        await attendanceHandlers.startBreak(student.id, 'toilet', setStudents);
        setBotMsg({ text: `🚶 יציאה לשירותים: ${student.name}`, isAlert: false });
      } else if (student.status === 'exited_temporarily') {
        await attendanceHandlers.endBreak(student.id, setStudents);
        setBotMsg({ text: `🔙 חזרה מהשירותים: ${student.name}` });
      } else if (student.status === 'submitted') {
        setBotMsg({ text: `🚫 ${student.name} כבר הגיש/ה את הבחינה ולא ניתן לקלוט שוב.` });
      }
    } else {
      await attendanceHandlers.handleAddStudent(classrooms.id, null, setStudents, scannedId);
      setBotMsg({ text: `✨ ${scannedId} נוסף ונקלט.` });  
    }
    setTimeout(() => {
      scanLock.current = false;
      lastScannedId.current = null;
    }, 3000);
  };

  const handleBotAction = (action) => {
    if (action === "NEXT_STEP") {
      const next = currentStep + 1;
      if (next < PROTOCOL_STEPS.length) {
        setCurrentStep(next);
        setBotMsg(PROTOCOL_STEPS[next]);
      }
    } else if (action === "FINISH_PROTOCOL") {
      setBotMsg({
        text: "הפרוטוקול הושלם בהצלחה. המערכת מוכנה להפעלת השעון.",
        options: [{ label: "הפעל מבחן כעת", action: "START_EXAM" }]
      });
    } else if (action === "START_EXAM") {
      handleStartExam();
    }
  };

  const handleStartExam = async () => {
    await examHandlers.handleChangeStatus(examId, 'active', setExamData);
    setBotMsg({ text: "המבחן הופעל! אני כאן לכל שאלה על סטטיסטיקות או נהלים." });
  };

  const handleStatusChange = async (id, status) => {
    const student = students.find(s => s.id === id || s.studentId === id);
    if (!student) return;
    if (status === 'שירותים') {
      await attendanceHandlers.startBreak(student.id, 'toilet', setStudents);
    } else if (status === 'במבחן' && student.status === 'exited_temporarily') {
      await attendanceHandlers.endBreak(student.id, setStudents);
    } else {
      const mappedStatus = status === 'במבחן' ? 'present' : status === 'סיים' ? 'submitted' : status;
      await attendanceHandlers.changeStudentStatus(student.id, mappedStatus, setStudents);
    }
  };

  const handleFinishExam = async () => {
    if (window.confirm("לסיים את המבחן לכולם?")) {
      await examHandlers.handleChangeStatus(examId, 'finished', setExamData);
      navigate('/select-exam');
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length > 2) {
      searchTimeout.current = setTimeout(() => {
        attendanceHandlers.handleSearchEligible(examId, value, setSearchResults, setIsSearching);
      }, 300);
    } else {
      setSearchResults([]);
    }
  };

  const confirmRemoval = async (student) => {
    if (window.confirm(`להסיר את ${student.name}?`)) {
      await attendanceHandlers.handleRemoveStudent(student.id, setStudents);
      setRemoveSearchQuery('');
      setIsRemoveBarOpen(false);
    }
  };

  const filteredForRemoval = useMemo(() => {
    if (!removeSearchQuery || removeSearchQuery.length < 2) return [];
    return students.filter(s => s.id?.includes(removeSearchQuery) || s.name.toLowerCase().includes(removeSearchQuery.toLowerCase())).slice(0, 3);
  }, [students, removeSearchQuery]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white font-black text-4xl">טוען מערכת...</div>;

  return (
    <div className="h-screen flex bg-[#0f172a] overflow-hidden text-right font-sans" dir="rtl">
      
      <Sidebar 
        tabs={[{ id: 'bot', icon: '🤖', label: 'עוזר' }, { id: 'chat', icon: '🏢', label: "קשר" }]} 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} 
        logoText="EX" logoColor="bg-emerald-600"
      >
        <SidebarPanel activeTab={activeTab} userRole="supervisor" externalMessage={botMsg} onAction={handleBotAction} />
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Header מוגדל */}
        <header className="bg-white/10 border-b-2 border-white/10 px-10 py-8 flex justify-between items-center z-30 backdrop-blur-md">
          <div className="flex items-center gap-10 text-white">
            <div>
              <h1 className="text-4xl font-black uppercase">ניהול בחינה</h1>
              <p className="text-xl text-emerald-400 font-bold mt-1">כיתה {classrooms.room_number || '---'}</p>
            </div>

            {/* ניווט טאבים ענק */}
            <nav className="flex bg-black/40 p-2 rounded-[25px] border border-white/20">
              <button 
                onClick={() => setDashboardTab('attendance')} 
                className={`px-14 py-5 rounded-[20px] text-3xl font-black transition-all ${dashboardTab === 'attendance' ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}
              >
                👥 נוכחות
              </button>
              <button 
                onClick={() => setDashboardTab('incident')} 
                className={`px-14 py-5 rounded-[20px] text-3xl font-black transition-all ${dashboardTab === 'incident' ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}
              >
                ⚠️ דיווח
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="scale-125 origin-right ml-20">
              {remainingTime !== null && <ExamTimer initialSeconds={remainingTime} isPaused={examData?.status !== 'active'} />}
            </div>
            <button onClick={handleFinishExam} className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-xl hover:bg-rose-600 hover:text-white transition-all shadow-xl">
              סיום
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 bg-[#0f172a] space-y-10">
          
          {dashboardTab === 'attendance' ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* סטטיסטיקה וכפתורים ראשיים */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <StatCard label="רשומים" value={students.length} variant="default" icon="👥" />
                <StatCard label="בחדר" value={students.filter(s => s.status === 'present').length} variant="info" icon="🏠" />
                
                <div className="md:col-span-3 flex gap-6">
                    {/* כפתור סריקה ענק */}
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="flex-1 bg-emerald-500 text-white rounded-[35px] flex flex-col items-center justify-center gap-2 hover:bg-emerald-400 shadow-2xl border-b-8 border-emerald-700 active:border-b-0 transition-all py-4"
                    >
                        <span className="text-5xl">📷</span>
                        <span className="font-black text-2xl uppercase">סרוק סטודנט</span>
                    </button>
                    {/* כפתור קריאה למנהל ענק */}
                    <button 
                        onClick={() => incidentHandlers.handleCallManager(examId)}
                        className="flex-1 bg-amber-500 text-white rounded-[35px] flex flex-col items-center justify-center gap-2 hover:bg-amber-400 shadow-2xl border-b-8 border-amber-700 active:border-b-0 transition-all py-4"
                    >
                        <span className="text-5xl">🆘</span>
                        <span className="font-black text-2xl uppercase">קריאה למנהל</span>
                    </button>
                </div>
              </div>

              {/* רשימת הסטודנטים */}
              <div className="bg-white rounded-[50px] shadow-2xl flex flex-col relative overflow-hidden min-h-125 border-8 border-white/5">
                
                {/* שורת הסרה (Removal Bar) */}
                <div className={`absolute top-0 left-0 w-full z-40 transition-all duration-500 bg-rose-600 ${isRemoveBarOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                    <div className="px-12 py-8 flex items-center gap-8">
                        <input 
                          type="text" placeholder="חפש שם להסרה..."
                          className="flex-1 bg-white/20 border-2 border-white/30 rounded-2xl py-5 px-8 text-2xl text-white font-bold placeholder:text-white/50 outline-none"
                          value={removeSearchQuery} onChange={(e) => setRemoveSearchQuery(e.target.value)}
                        />
                        <div className="flex gap-4">
                          {filteredForRemoval.map(s => (
                            <button key={s.id} onClick={() => confirmRemoval(s)} className="bg-white px-8 py-4 rounded-2xl font-black text-slate-800 text-xl">
                              {s.name} ✖
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setIsRemoveBarOpen(false)} className="text-white font-black text-xl">ביטול</button>
                    </div>
                </div>

                <div className="p-12 flex flex-col gap-10">
                  <div className="flex justify-between items-center">
                    <h2 className="text-5xl font-black text-slate-900 italic">Attendance</h2>
                    <button onClick={() => setIsRemoveBarOpen(true)} className="text-rose-600 font-black text-2xl underline decoration-4 underline-offset-8">✖ הסרה מהירה</button>
                  </div>

                  {/* חיפוש והוספה ידנית - מוגדל */}
                  <div className="relative">
                    <input 
                      type="text" placeholder="חיפוש או הוספת סטודנט..." 
                      className="w-full bg-slate-100 border-4 border-transparent focus:border-emerald-500 py-8 px-10 rounded-[30px] font-black text-3xl shadow-inner outline-none transition-all placeholder:text-slate-400"
                      value={searchQuery} onChange={handleSearchChange}
                    />
                    {searchResults.length > 0 && (
                      <ul className="absolute z-50 w-full mt-4 bg-white rounded-[30px] shadow-2xl border-4 border-slate-100 overflow-hidden">
                        {searchResults.map(result => (
                          <li key={result.id} onClick={() => { attendanceHandlers.handleAddStudent(classrooms.id, result.id, setStudents); setSearchQuery(''); setSearchResults([]); }}
                              className="px-10 py-7 hover:bg-emerald-50 cursor-pointer flex justify-between items-center border-b last:border-0 border-slate-100">
                            <span className="font-black text-3xl text-slate-800">{result.full_name} ({result.student_id})</span>
                            <span className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black text-xl">הוסף +</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-12 pt-0 overflow-y-auto">
                  <StudentGrid students={students} onStatusChange={handleStatusChange} />
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto animate-in zoom-in-95 duration-500">
                <IncidentReportPage examId={examId} classrooms={classrooms} />
            </div>
          )}
        </main>
      </div>

      {isScannerOpen && (
        <AdmissionScanner 
          key="unique-scanner" 
          onScan={handleScanResult} 
          onClose={() => {
            setIsScannerOpen(false);
            scanLock.current = false;
          }} 
        />
      )}
    </div>
  );
}