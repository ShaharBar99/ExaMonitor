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
import AdmissionScanner from './AdmissionScanner'; // ייבוא הסורק

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [remainingTime, setRemainingTime] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  
  const [botMsg, setBotMsg] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const alertedStudents = useRef(new Set());
  const [isScannerOpen, setIsScannerOpen] = useState(false); // מצב סורק

  const [isRemoveBarOpen, setIsRemoveBarOpen] = useState(false);
  const [removeSearchQuery, setRemoveSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);

  const lastScannedId = useRef(null);
  const scanLock = useRef(false);

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
    // מקרה 1: הסטודנט רשום אך עדיין לא נכנס (Check-in)
    if (student.status === 'absent' || !student.status) {
      await handleStatusChange(student.id, 'במבחן');
      setBotMsg({ text: `✅ כניסה למבחן: ${student.name}` });
    } 
    
    // מקרה 2: הסטודנט כבר במבחן ורוצה לצאת לשירותים
    else if (student.status === 'present') {
      await attendanceHandlers.startBreak(student.id, 'toilet', setStudents);
      setBotMsg({ text: `🚶 יציאה לשירותים: ${student.name}`, isAlert: false });
    } 
    
    // מקרה 3: הסטודנט בחוץ וחוזר כעת מהשירותים
    else if (student.status === 'exited_temporarily') {
      await attendanceHandlers.endBreak(student.id, setStudents);
      setBotMsg({ text: `🔙 חזרה מהשירותים: ${student.name}` });
    }
    
    // מקרה 4: הסטודנט כבר הגיש את הבחינה
    else if (student.status === 'submitted') {
      setBotMsg({ text: `🚫 ${student.name} כבר הגיש/ה את הבחינה ולא ניתן לקלוט שוב.` });
    }
  } else {
    await attendanceHandlers.handleAddStudent(classrooms.id, null, setStudents, scannedId);
      
      setBotMsg({ text: `✨ ${scannedId} נוסף ונקלט.` });  
  }

// פונקציות עזר לצלילים כדי להבדיל בין כניסה ליציאה


  // 2. שחרור הנעילה אחרי 3 שניות כדי לאפשר סריקה של הסטודנט הבא
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
    console.log('Changing status for student:', student, 'to', status);
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white font-black italic">INITIALIZING SYSTEM...</div>;

  return (
    <div className="h-screen flex bg-[#0f172a] overflow-hidden text-right font-sans" dir="rtl">
      
      <Sidebar 
        tabs={[{ id: 'bot', icon: '🤖', label: 'ExamBot' }, { id: 'chat', icon: '🏢', label: "קשר" }]} 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} 
        logoText="EX" logoColor="bg-emerald-600"
      >
        <SidebarPanel activeTab={activeTab} userRole="supervisor" externalMessage={botMsg} onAction={handleBotAction} />
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white/5 border-b border-white/10 px-10 py-8 flex justify-between items-center z-30 backdrop-blur-md">
          <div className="flex items-center gap-8 text-white">
            <div>
              <h1 className="text-3xl font-black leading-none tracking-tight uppercase">Room Control</h1>
              <div className="flex items-center gap-3 mt-3">
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${examData?.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                   {classrooms.room_number || 'WING A'} • {examId} • {examData?.status === 'pending' ? 'הכנה' : 'פעולה'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setIsScannerOpen(true)} className="bg-emerald-600 text-white px-6 py-4 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-emerald-500 transition-all">
              <span>📷</span> סרוק לקליטה
            </button>
            <HeaderButton onClick={() => incidentHandlers.handleCallManager(examId)} variant="warning" label="קריאה למנהל" icon="🆘" />
            <HeaderButton onClick={() => navigate(`/exam/incident-report/${examId}`)} variant="danger" label="דיווח חריג" icon="⚠️" />
            <div className="mx-6 px-6 border-x border-white/10 shrink-0">
              {remainingTime !== null && <ExamTimer initialSeconds={remainingTime} isPaused={examData?.status !== 'active'} />}
            </div>
            <button onClick={handleFinishExam} className="bg-white text-[#0f172a] px-10 py-5 rounded-2xl font-black text-xs uppercase hover:bg-emerald-500 hover:text-white transition-all">
              סיום מבחן
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 bg-[#0f172a] space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
            <StatCard label="רשומים" value={students.length} variant="default" icon="👥" />
            <StatCard label="הגישו" value={students.filter(s => s.status === 'submitted').length} variant="success" icon="📝" />
            <StatCard label="בחדר" value={students.filter(s => s.status === 'present').length} variant="info" icon="🏠" />
            <StatCard label="בחוץ" value={students.filter(s => s.status === 'exited_temporarily').length} variant="warning" highlight={students.filter(s => s.status === 'exited_temporarily').length > 0} icon="🚶" />
          </div>

          <div className="bg-white rounded-[50px] shadow-2xl border border-white/10 flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 min-h-150">
            
            {/* Removal Bar */}
            <div className={`absolute top-0 left-0 w-full z-40 transition-all duration-500 bg-rose-600 ${isRemoveBarOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                <div className="px-12 py-8 flex items-center gap-8">
                    <input 
                      type="text" placeholder="חיפוש להסרה מהירה..."
                      className="flex-1 bg-white/20 border-2 border-white/30 rounded-2xl py-4 px-8 text-white font-bold placeholder:text-white/50 outline-none"
                      value={removeSearchQuery} onChange={(e) => setRemoveSearchQuery(e.target.value)}
                    />
                    <div className="flex gap-4">
                      {filteredForRemoval.map(s => (
                        <button key={s.id} onClick={() => confirmRemoval(s)} className="bg-white px-6 py-4 rounded-2xl font-black text-slate-800 text-xs shadow-xl">
                          {s.name} ✖
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setIsRemoveBarOpen(false)} className="text-white font-black text-xs uppercase">ביטול</button>
                </div>
            </div>

            <div className="p-12 flex flex-col gap-10">
              <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-[#0f172a] uppercase tracking-tighter italic">Attendance</h2>
                <button onClick={() => setIsRemoveBarOpen(true)} className="bg-rose-50 text-rose-500 px-8 py-4 rounded-2xl font-black text-[11px] uppercase border-2 border-rose-100 hover:bg-rose-500 hover:text-white transition-all">
                  ✖ הסרה מהירה
                </button>
              </div>

              {/* חיפוש והוספה ידנית */}
              <div className="relative bg-slate-50 p-6 rounded-[30px] border border-slate-100">
                <input 
                  type="text" placeholder="חיפוש סטודנט להוספה..." 
                  className="w-full bg-white border-2 border-transparent focus:border-emerald-500 py-4 px-6 rounded-2xl font-bold shadow-sm outline-none transition-all"
                  value={searchQuery} onChange={handleSearchChange}
                />
                {searchResults.length > 0 && (
                  <ul className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                    {searchResults.map(result => (
                      <li key={result.id} onClick={() => { attendanceHandlers.handleAddStudent(classrooms.id, result.id, setStudents); setSearchQuery(''); setSearchResults([]); }}
                          className="px-6 py-4 hover:bg-emerald-50 cursor-pointer flex justify-between items-center group">
                        <span className="font-black text-slate-800">{result.full_name} ({result.student_id})</span>
                        <span className="text-emerald-600 font-black text-xs opacity-0 group-hover:opacity-100">+ הוסף</span>
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
        </main>
      </div>

      {isScannerOpen && <AdmissionScanner onScan={handleScanResult} onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
}