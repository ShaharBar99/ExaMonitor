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
  
  const { examData, setExamData, updateExamStatus, clearExam } = useExam();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bot');
  const [dashboardTab, setDashboardTab] = useState('attendance'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [remainingTime, setRemainingTime] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [examName, setExamName] = useState('');
  
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

  // Initial setup
  useEffect(() => {
    attendanceHandlers.initSupervisorConsole(examId, user.id, setStudents, setLoading, setExamData);
  }, [examId, user.id, setExamData]);

  // Fetch examData if null
  useEffect(() => {
    const fetchExamData = async () => {
      if (!examData && examId) {
        try {
          const fetchedExam = await examHandlers.getExam(examId);
          setExamData(fetchedExam);
        } catch (error) {
          console.error('Failed to fetch exam data:', error);
        }
      }
    };
    fetchExamData();
  }, [examData, examId, setExamData]);

  useEffect(() => {
    if(user.role !== 'supervisor') navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (location.state?.classrooms) {
      console.log(location.state.classrooms);
      setClassrooms(location.state.classrooms[0]);
      setExamName(location.state.classrooms[0].examName);
    }
  }, [location.state]);

  // Sync Global Timers
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
  // Only act once examData is actually loaded from the server
  if (!loading && examData) {
    if (examData.status === 'active' || examData.status === 'finished') {
      // If exam is already active/done, skip protocol entirely
      setBotMsg({ text: "המבחן פעיל. אני כאן לכל שאלה על סטטיסטיקות או נהלים." });
      setCurrentStep(PROTOCOL_STEPS.length);
    } else if (examData.status === 'pending' && currentStep === 0) {
      // Only show step 1 if we are truly in pending mode
      setBotMsg(PROTOCOL_STEPS[0]);
    }
  }
}, [examData, loading]); // Added loading to dependencies

  // MONITORING: Safety Alerts & 10 Minute Warning
  useEffect(() => {
    const monitorInterval = setInterval(() => {
      const now = new Date();
      
      // 1. Safety Check: Students out for > 15 mins
      students.forEach(student => {
        if (student.status === 'exited_temporarily' && student.last_exit_time) {
          const exitTime = new Date(student.last_exit_time);
          const diffInMinutes = (now - exitTime) / 60000;
          if (diffInMinutes > 15 && !alertedStudents.current.has(student.id)) {
            setBotMsg({
              text: `⚠️ אזהרת בטיחות: הסטודנט ${student.name} (ת"ז: ${student.student_id}) נמצא בחוץ מעל 15 דקות! נא לבדוק את מצבו.`,
              isAlert: true
            });
            alertedStudents.current.add(student.id);
          }
        }
        if (student.status === 'present' && alertedStudents.current.has(student.id)) {
          alertedStudents.current.delete(student.id);
        }
      });

      // 2. 10 Minute Warning
      if (remainingTime <= 600 && remainingTime > 540) {
          setBotMsg({
            text: "📢 שימו לב: נותרו 10 דקות לסיום המבחן. נא להכריז על כך בכיתה.",
            isAlert: true
          });
      }
    }, 15000);
    return () => clearInterval(monitorInterval);
  }, [students, remainingTime]);

  // AUTOMATION: Auto-submit students when their specific time is up
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
    updateExamStatus('active');
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
      clearExam();
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

  if (loading) return <div className={`h-screen flex items-center justify-center font-black text-2xl md:text-4xl px-4 text-center ${isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'}`}>טוען מערכת...</div>;

  return (
    <div className={`min-h-screen lg:h-screen flex flex-col lg:flex-row overflow-x-hidden text-right font-sans transition-colors duration-500 ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`} dir="rtl">
      
      <Sidebar 
        tabs={[{ id: 'bot', icon: '🤖', label: 'עוזר' }, { id: 'chat', icon: '🏢', label: "קשר" }]} 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} 
        logoText="EX" logoColor="bg-emerald-600"
      >
        <SidebarPanel activeTab={activeTab} userRole="supervisor" externalMessage={botMsg} liveStats={liveStats} onAction={handleBotAction} userName={user.full_name} />
      </Sidebar>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        
        <header className={`border-b-2 p-4 md:px-10 md:py-8 flex flex-col lg:flex-row gap-6 justify-between items-center z-30 backdrop-blur-md transition-colors ${
          isDark ? 'bg-white/10 border-white/10' : 'bg-white/80 border-slate-200'
        }`}>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10 w-full lg:w-auto">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-3 rounded-xl bg-slate-100 dark:bg-white/10 text-2xl"
              >
                ☰
              </button>

              <div className={`text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <h1 className="text-xl md:text-3xl font-black uppercase leading-tight">ניהול בחינה</h1>
                <p className="text-sm md:text-lg text-emerald-500 font-bold">{examName || '---'}</p>
                <p className="text-sm md:text-lg text-emerald-500 font-bold">כיתה {classrooms.room_number || '---'}</p>
              </div>
            </div>

            <nav className={`flex p-1 md:p-2 rounded-[25px] border w-full md:w-auto overflow-x-auto ${isDark ? 'bg-black/40 border-white/20' : 'bg-slate-200/50 border-slate-300'}`}>
              <button 
                onClick={() => setDashboardTab('attendance')} 
                className={`flex-1 md:flex-none px-6 md:px-14 py-3 md:py-5 rounded-[20px] text-lg md:text-3xl font-black transition-all whitespace-nowrap ${
                  dashboardTab === 'attendance' 
                    ? 'bg-emerald-600 text-white shadow-xl' 
                    : isDark 
                      ? 'text-slate-400 hover:text-white' 
                      : 'text-slate-400 hover:text-slate-800 hover:bg-black/5'
                }`}
              >
                👥 נוכחות
              </button>
              <button 
                onClick={() => setDashboardTab('incident')} 
                className={`flex-1 md:flex-none px-6 md:px-14 py-3 md:py-5 rounded-[20px] text-lg md:text-3xl font-black transition-all whitespace-nowrap ${
                  dashboardTab === 'incident' 
                    ? 'bg-rose-600 text-white shadow-xl' 
                    : isDark 
                      ? 'text-slate-400 hover:text-white' 
                      : 'text-slate-400 hover:text-slate-800 hover:bg-black/5'
                }`}
              >
                ⚠️ דיווח
              </button>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 w-full lg:w-auto">
            {timers.length > 0 ? (
            <div className={`flex flex-col items-center p-3 md:p-4 rounded-[20px] md:rounded-[30px] border shadow-2xl w-full sm:min-w-70 ${isDark ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200'}`}>
      
                <div className="scale-90 md:scale-125 transform mb-2 md:mb-4">
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

                <div className={`flex gap-1 md:gap-2 p-1 rounded-2xl border w-full justify-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
                  {timers.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTimerId(t.id)}
                      className={`px-2 md:px-4 py-1 md:py-2 rounded-xl text-[10px] md:text-xs font-black transition-all duration-300 ${
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
              <div className={`px-4 py-4 md:px-8 md:py-6 rounded-[20px] md:rounded-[30px] border w-full text-center ${isDark ? 'bg-black/20 border-white/5 text-white/40' : 'bg-white border-slate-200 text-slate-400'}`}>
                <span className="font-bold text-base md:text-lg animate-pulse">
                  {examData?.status === 'pending' ? 'הטיימר יופעל עם תחילת המבחן' : 'מחשב זמן...'}
                </span>
              </div>
            )}

            <button 
              onClick={handleFinishExam} 
              className="w-full sm:w-auto bg-rose-600 text-white px-8 md:px-12 py-4 md:py-7 rounded-[20px] md:rounded-[30px] font-black text-xl md:text-2xl hover:bg-rose-500 transition-all shadow-[0_0_30px_rgba(225,29,72,0.3)] active:scale-95"
            >
              סיום
            </button>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-4 md:p-12 space-y-6 md:space-y-10 transition-colors ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
          
          {dashboardTab === 'attendance' ? (
            <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                <StatCard label="רשומים" value={students.length} variant="default" icon="👥" />
                <StatCard label="בחדר" value={students.filter(s => s.status === 'present').length} variant="info" icon="🏠" />
                
                <div className="col-span-2 md:col-span-3 flex flex-col sm:flex-row gap-4 md:gap-6">
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="flex-1 bg-emerald-500 text-white rounded-[25px] md:rounded-[35px] flex flex-col items-center justify-center gap-1 md:gap-2 hover:bg-emerald-400 shadow-2xl border-b-4 md:border-b-8 border-emerald-700 active:border-b-0 transition-all py-4 md:py-4"
                    >
                        <span className="text-3xl md:text-5xl">📷</span>
                        <span className="font-black text-lg md:text-2xl uppercase">סרוק סטודנט</span>
                    </button>
                </div>
              </div>

              <div className={`rounded-[30px] md:rounded-[50px] shadow-2xl flex flex-col relative overflow-hidden min-h-100 border-4 md:border-8 transition-all duration-500 ${
                isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-white'
              }`}>
                
                <div className={`absolute top-0 left-0 w-full z-40 transition-all duration-500 bg-rose-600 ${isRemoveBarOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                    <div className="px-6 py-4 md:px-12 md:py-8 flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        <input 
                          type="text" placeholder="חפש שם להסרה..."
                          className="w-full md:flex-1 bg-white/20 border-2 border-white/30 rounded-2xl py-3 md:py-5 px-6 md:px-8 text-xl md:text-2xl text-white font-bold placeholder:text-white/50 outline-none"
                          value={removeSearchQuery} onChange={(e) => setRemoveSearchQuery(e.target.value)}
                        />
                        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                          {filteredForRemoval.map(s => (
                            <button key={s.id} onClick={() => confirmRemoval(s)} className="bg-white px-4 py-2 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-slate-800 text-sm md:text-xl">
                              {s.name} ✖
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setIsRemoveBarOpen(false)} className="text-white font-black text-lg md:text-xl">ביטול</button>
                    </div>
                </div>

                <div className="p-6 md:p-12 flex flex-col gap-6 md:gap-10">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className={`text-3xl md:text-5xl font-black italic transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>Attendance</h2>
                    <button onClick={() => setIsRemoveBarOpen(true)} className="text-rose-600 font-black text-lg md:text-2xl underline decoration-2 md:decoration-4 underline-offset-4 md:underline-offset-8">✖ הסרה מהירה</button>
                  </div>

                  <div className="relative">
                    <input 
                      type="text" placeholder="חיפוש או הוספת סטודנט..." 
                      className={`w-full py-4 md:py-8 px-6 md:px-10 rounded-[20px] md:rounded-[30px] font-black text-xl md:text-3xl shadow-inner outline-none transition-all border-2 md:border-4 ${
                        isDark 
                          ? 'bg-slate-800 border-transparent text-white focus:border-emerald-500/40 placeholder:text-slate-500' 
                          : 'bg-slate-100 text-slate-700 placeholder:text-slate-400'
                      }`}
                      value={searchQuery} onChange={handleSearchChange}
                    />
                    {searchResults.length > 0 && (
                      <ul className={`absolute z-50 w-full mt-2 md:mt-4 rounded-[20px] md:rounded-[30px] shadow-2xl border-2 md:border-4 overflow-hidden transition-colors ${
                        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                      }`}>
                        {searchResults.map(result => (
                          <li key={result.id} onClick={() => { attendanceHandlers.handleAddStudent(classrooms.id, result.id, setStudents, result.student_id); setSearchQuery(''); setSearchResults([]); }}
                              className={`px-6 py-4 md:px-10 md:py-7 cursor-pointer flex justify-between items-center border-b last:border-0 transition-colors ${
                                isDark ? 'hover:bg-slate-700 border-slate-700' : 'hover:bg-emerald-50 border-slate-100'
                              }`}>
                            <span className={`font-black text-lg md:text-3xl ${isDark ? 'text-white' : 'text-slate-800'}`}>{result.full_name} ({result.student_id})</span>
                            <span className="bg-emerald-600 text-white px-4 py-2 md:px-8 md:py-3 rounded-xl font-black text-sm md:text-xl">הוסף +</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-6 md:p-12 pt-0 overflow-y-auto">
                  <StudentGrid students={students} onStatusChange={handleStatusChange} onMoveClass={handleOpenMoveModal}/>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-6xl mx-auto animate-in zoom-in-95 duration-500">
                <IncidentReportPage examId={examId} classrooms={classrooms} onBack={() => setDashboardTab('attendance')} />
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

          <div className={`relative rounded-[30px] md:rounded-[40px] p-6 md:p-10 w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 text-right ${
            isDark ? 'bg-slate-900' : 'bg-white'
          }`}>
            <h3 className={`text-2xl md:text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>העברת כיתה</h3>
            <p className={`font-bold mb-6 md:mb-8 text-sm md:text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              לאיזו כיתה תרצה להעביר את <span className="text-emerald-600">{studentToMove.name}</span>?
            </p>
            
            <div className="space-y-3 md:space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {otherClassrooms.length > 0 ? (
                otherClassrooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => handleExecuteMove(room.id)}
                    className={`w-full flex justify-between items-center p-4 md:p-6 border-2 border-transparent rounded-2xl md:rounded-3xl transition-all group ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 hover:border-emerald-500/30' : 'bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200'
                    }`}
                  >
                    <div className="text-right">
                      <span className={`block font-black text-lg md:text-xl ${isDark ? 'text-white' : 'text-slate-800'}`}>חדר {room.room_number}</span>
                      <span className="text-xs md:text-sm text-slate-400 font-bold">{room.building || 'בניין מרכזי'}</span>
                    </div>
                    <span className={`px-3 py-1 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-black shadow-sm transition-all ${
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
              className="w-full mt-6 md:mt-8 py-2 md:py-4 text-slate-400 font-black hover:text-slate-600 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}