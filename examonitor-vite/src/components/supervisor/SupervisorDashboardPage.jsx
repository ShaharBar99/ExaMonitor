import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { attendanceHandlers } from '../../handlers/attendanceHandlers';
import { timerHandlers } from '../../handlers/timerHandlers';
import { examHandlers } from '../../handlers/examHandlers';
import Sidebar from '../layout/Sidebar';
import SidebarPanel from '../exam/SidebarPanel';
import StudentGrid from './StudentGrid';
import ExamTimer from '../exam/ExamTimer';
import { useExam } from '../state/ExamContext';
import { useAuth } from '../state/AuthContext';
import StatCard from '../exam/StatCard';
import AdmissionScanner from './AdmissionScanner';
import IncidentReportPage from './IncidentReportPage';
import { classroomHandler } from '../../handlers/classroomHandlers';
import { useTheme } from '../state/ThemeContext';

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
  const { isDark } = useTheme(); 
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
  const [timers, setTimers] = useState([]);
  const [selectedTimerId, setSelectedTimerId] = useState('reg');

  const [studentToMove, setStudentToMove] = useState(null); 
  const [otherClassrooms, setOtherClassrooms] = useState([]); 

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
      const timingData = await timerHandlers.getTimeDataByExamId(examId);
      
      if (timingData?.start_time && examData?.status === 'active') {
        const startTime = new Date(timingData.start_time).getTime();
        const now = Date.now();
        
        const baseDurationMin = (timingData.original_duration || 0) + (timingData.extra_time || 0);
        
        const calculateRemaining = (percent) => {
          const totalStudentDurationMin = baseDurationMin + (timingData.original_duration * percent);
          const targetEndTime = startTime + (totalStudentDurationMin * 60000);
          return Math.max(0, Math.floor((targetEndTime - now) / 1000));
        };

        const regSecs = calculateRemaining(0);
        setRemainingTime(regSecs);

        setTimers([
          { id: 'reg', label: "רגיל (0%)", secs: regSecs, color: "#34d399" },
          { id: '25', label: "תוספת 25%", secs: calculateRemaining(0.25), color: "#818cf8" },
          { id: '50', label: "תוספת 50%", secs: calculateRemaining(0.50), color: "#c084fc" }
        ]);
      } else {
        setTimers([]);
      }
    };

    syncTime();
    const interval = setInterval(syncTime, 1000);
    return () => clearInterval(interval);
  }, [examId, examData?.status]);

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

  useEffect(() => {
    if (examData?.status !== 'active' || timers.length === 0) return;

    const autoSubmitCheck = async () => {
      const regTimer = timers.find(t => t.id === 'reg');
      const t25Timer = timers.find(t => t.id === '25');
      const t50Timer = timers.find(t => t.id === '50');

      const studentsToSubmit = students.filter(student => {
        if (student.status !== 'present' && student.status !== 'exited_temporarily') return false;
        const extraTimePercent = student.personalExtra || 0;
        if (extraTimePercent === 0 && regTimer?.secs <= 0) return true;
        if (extraTimePercent === 25 && t25Timer?.secs <= 0) return true;
        if (extraTimePercent === 50 && t50Timer?.secs <= 0) return true;
        return false;
      });

      if (studentsToSubmit.length > 0) {
        for (const student of studentsToSubmit) {
          try {
            await attendanceHandlers.changeStudentStatus(student.id, 'submitted', setStudents);
            setBotMsg({
              text: `⏰ זמן הבחינה הסתיים עבור ${student.name}. הטופס הוגש אוטומטית.`,
              isAlert: true
            });
          } catch (error) {
            console.error(`Failed to auto-submit for ${student.id}`, error);
          }
        }
      }
    };
    autoSubmitCheck();
  }, [timers, students, examData?.status]);

  const liveStats = useMemo(() => {
    const out = students.filter(s => s.status === 'exited_temporarily').length;
    const submitted = students.filter(s => s.status === 'submitted' || s.status === 'סיים').length;
    const total = students.length;
    const present = total - submitted - out;
    const studentsOut = students.filter(s => s.status === 'exited_temporarily');
    const longestOutStudent = [...studentsOut].sort((a, b) => 
      new Date(a.last_exit_time) - new Date(b.last_exit_time)
    )[0];

    return {
      present, out, submitted, total,
      percentFinished: total > 0 ? Math.round((submitted / total) * 100) : 0,
      longestOutName: longestOutStudent?.name || null
    };
  }, [students]);

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
        await attendanceHandlers.handleStartBreak(student.id, 'toilet', setStudents);
        setBotMsg({ text: `🚶 יציאה לשירותים: ${student.name}`, isAlert: false });
      } else if (student.status === 'exited_temporarily') {
        await attendanceHandlers.handleEndBreak(student.id, setStudents);
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

  const handleOpenMoveModal = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    setStudentToMove(student);
    try {
      const allRooms = await classroomHandler.getClassrooms(examId);
      const filteredRooms = allRooms.filter(room => room.id !== classrooms.id);
      setOtherClassrooms(filteredRooms);
    } catch (err) {
      console.error("Failed to fetch other classrooms", err);
    }
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
      await attendanceHandlers.handleStartBreak(student.id, 'toilet', setStudents);
    } else if (status === 'במבחן' && student.status === 'exited_temporarily') {
      await attendanceHandlers.handleEndBreak(student.id, setStudents);
    } else {
      const mappedStatus = status === 'במבחן' ? 'present' : status === 'סיים' ? 'submitted' : status;
      await attendanceHandlers.changeStudentStatus(student.id, mappedStatus, setStudents);
    }
  };

  const handleFinishExam = async () => {
    if (window.confirm("לסיים את המבחן לכולם?")) {
      await examHandlers.handleChangeStatus(examId, 'finished', setExamData, user.id);
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

  const handleExecuteMove = async (targetRoomId) => {
    if (!studentToMove) return;
    try {
      await attendanceHandlers.handleRemoveStudent(studentToMove.id, setStudents);
      await attendanceHandlers.handleAddStudent(targetRoomId, null, (newStudents) => {
        console.log(`Student ${studentToMove.name} added to room ${targetRoomId}`);
      }, studentToMove.studentId);
      setBotMsg({
        text: `🔄 הסטודנט ${studentToMove.name} הועבר בהצלחה לחדר אחר.`,
        isAlert: false
      });
      setStudentToMove(null);
    } catch (err) {
      console.error("Transfer failed:", err);
      alert("ההעברה נכשלה. אנא נסה שוב.");
    }
  };

  const filteredForRemoval = useMemo(() => {
    if (!removeSearchQuery || removeSearchQuery.length < 2) return [];
    return students.filter(s => s.id?.includes(removeSearchQuery) || s.name.toLowerCase().includes(removeSearchQuery.toLowerCase())).slice(0, 3);
  }, [students, removeSearchQuery]);

  if (loading) return <div className={`h-screen flex items-center justify-center font-black text-4xl ${isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'}`}>טוען מערכת...</div>;

  return (
    <div className={`h-screen flex overflow-hidden text-right font-sans transition-colors duration-500 ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`} dir="rtl">
      
      <Sidebar 
        tabs={[{ id: 'bot', icon: '🤖', label: 'עוזר' }, { id: 'chat', icon: '🏢', label: "קשר" }]} 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} 
        logoText="EX" logoColor="bg-emerald-600"
      >
        <SidebarPanel activeTab={activeTab} userRole="supervisor" externalMessage={botMsg} liveStats={liveStats} onAction={handleBotAction} />
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        <header className={`border-b-2 px-10 py-8 flex justify-between items-center z-30 backdrop-blur-md transition-colors ${
          isDark ? 'bg-white/10 border-white/10' : 'bg-white/80 border-slate-200'
        }`}>
          <div className="flex items-center gap-10">
            <div className={isDark ? 'text-white' : 'text-slate-900'}>
              <h1 className="text-4xl font-black uppercase">ניהול בחינה</h1>
              <p className="text-xl text-emerald-500 font-bold mt-1">כיתה {classrooms.room_number || '---'}</p>
            </div>

            <nav className={`flex p-2 rounded-[25px] border ${isDark ? 'bg-black/40 border-white/20' : 'bg-slate-200/50 border-slate-300'}`}>
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

          <div className="flex items-center gap-8">
            {timers.length > 0 ? (
            <div className={`flex flex-col items-center p-4 rounded-[30px] border shadow-2xl min-w-70 ${isDark ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200'}`}>
      
                <div className="scale-125 transform mb-4">
                  {timers.filter(t => t.id === selectedTimerId).map(t => (
                    <div key={t.id} className="flex flex-col items-center animate-in zoom-in duration-300">
                      <ExamTimer 
                          key={`${t.id}-${t.secs}`} 
                          initialSeconds={t.secs} 
                          isPaused={examData?.status !== 'active'} 
                        />
                    </div>
                  ))}
                </div>

                <div className={`flex gap-2 p-1 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
                  {timers.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTimerId(t.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${
                        selectedTimerId === t.id 
                          ? 'shadow-lg scale-105 text-white' 
                          : isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      style={selectedTimerId === t.id ? { backgroundColor: t.color } : {}}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`px-8 py-6 rounded-[30px] border ${isDark ? 'bg-black/20 border-white/5 text-white/40' : 'bg-white border-slate-200 text-slate-400'}`}>
                <span className="font-bold text-lg animate-pulse">
                  {examData?.status === 'pending' ? 'הטיימר יופעל עם תחילת המבחן' : 'מחשב זמן...'}
                </span>
              </div>
            )}

            <button 
              onClick={handleFinishExam} 
              className="bg-rose-600 text-white px-12 py-7 rounded-[30px] font-black text-2xl hover:bg-rose-500 transition-all shadow-[0_0_30px_rgba(225,29,72,0.3)] active:scale-95"
            >
              סיום
            </button>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-12 space-y-10 transition-colors ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
          
          {dashboardTab === 'attendance' ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <StatCard label="רשומים" value={students.length} variant="default" icon="👥" />
                <StatCard label="בחדר" value={students.filter(s => s.status === 'present').length} variant="info" icon="🏠" />
                
                <div className="md:col-span-3 flex gap-6">
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="flex-1 bg-emerald-500 text-white rounded-[35px] flex flex-col items-center justify-center gap-2 hover:bg-emerald-400 shadow-2xl border-b-8 border-emerald-700 active:border-b-0 transition-all py-4"
                    >
                        <span className="text-5xl">📷</span>
                        <span className="font-black text-2xl uppercase">סרוק סטודנט</span>
                    </button>
                    <button 
                        onClick={() => examHandlers.handleAddExtraTime(examId, setExamData)}
                        className="flex-1 bg-indigo-600 text-white rounded-[35px] flex flex-col items-center justify-center gap-2 hover:bg-indigo-500 shadow-2xl border-b-8 border-indigo-800 active:border-b-0 transition-all py-4"
                    >
                        <span className="text-5xl">⏳</span>
                        <div className="flex flex-col items-center">
                            <span className="font-black text-2xl uppercase">הוסף הארכה</span>
                            <span className="text-sm font-bold opacity-80">(15 דקות לכולם)</span>
                        </div>
                    </button>
                </div>
              </div>

              {/* Attendance Section */}
              <div className={`rounded-[50px] shadow-2xl flex flex-col relative overflow-hidden min-h-125 border-8 transition-all duration-500 ${
                isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-white'
              }`}>
                
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
                    <h2 className={`text-5xl font-black italic transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>Attendance</h2>
                    <button onClick={() => setIsRemoveBarOpen(true)} className="text-rose-600 font-black text-2xl underline decoration-4 underline-offset-8">✖ הסרה מהירה</button>
                  </div>

                  <div className="relative">
                    <input 
                      type="text" placeholder="חיפוש או הוספת סטודנט..." 
                      className={`w-full py-8 px-10 rounded-[30px] font-black text-3xl shadow-inner outline-none transition-all border-4 border-transparent focus:border-emerald-500 ${
                        isDark 
                          ? 'bg-slate-800 text-white placeholder:text-slate-500' 
                          : 'bg-slate-100 text-slate-700 placeholder:text-slate-400'
                      }`}
                      value={searchQuery} onChange={handleSearchChange}
                    />
                    {searchResults.length > 0 && (
                      <ul className={`absolute z-50 w-full mt-4 rounded-[30px] shadow-2xl border-4 overflow-hidden transition-colors ${
                        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                      }`}>
                        {searchResults.map(result => (
                          <li key={result.id} onClick={() => { attendanceHandlers.handleAddStudent(classrooms.id, result.id, setStudents, result.student_id); setSearchQuery(''); setSearchResults([]); }}
                              className={`px-10 py-7 cursor-pointer flex justify-between items-center border-b last:border-0 transition-colors ${
                                isDark ? 'hover:bg-slate-700 border-slate-700' : 'hover:bg-emerald-50 border-slate-100'
                              }`}>
                            <span className={`font-black text-3xl ${isDark ? 'text-white' : 'text-slate-800'}`}>{result.full_name} ({result.student_id})</span>
                            <span className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black text-xl">הוסף +</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-12 pt-0 overflow-y-auto">
                  <StudentGrid students={students} onStatusChange={handleStatusChange} onMoveClass={handleOpenMoveModal}/>
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
      
      {studentToMove && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
            onClick={() => setStudentToMove(null)} 
          />

          <div className={`relative rounded-[40px] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 text-right ${
            isDark ? 'bg-slate-900' : 'bg-white'
          }`}>
            <h3 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>העברת כיתה</h3>
            <p className={`font-bold mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              לאיזו כיתה תרצה להעביר את <span className="text-emerald-600">{studentToMove.name}</span>?
            </p>
            
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {otherClassrooms.length > 0 ? (
                otherClassrooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => handleExecuteMove(room.id)}
                    className={`w-full flex justify-between items-center p-6 border-2 border-transparent rounded-3xl transition-all group ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 hover:border-emerald-500/30' : 'bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200'
                    }`}
                  >
                    <div className="text-right">
                      <span className={`block font-black text-xl ${isDark ? 'text-white' : 'text-slate-800'}`}>חדר {room.room_number}</span>
                      <span className="text-sm text-slate-400 font-bold">{room.building || 'בניין מרכזי'}</span>
                    </div>
                    <span className={`px-4 py-2 rounded-xl font-black shadow-sm transition-all ${
                      isDark ? 'bg-slate-700 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-white text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                    }`}>
                      העבר לכאן ←
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 font-bold italic">
                  לא נמצאו כיתות נוספות למבחן זה
                </div>
              )}
            </div>

            <button 
              onClick={() => setStudentToMove(null)}
              className="w-full mt-8 py-4 text-slate-400 font-black hover:text-slate-600 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}