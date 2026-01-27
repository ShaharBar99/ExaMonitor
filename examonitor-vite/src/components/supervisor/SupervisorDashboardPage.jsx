import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { attendanceHandlers } from '../../handlers/attendanceHandlers';
import { timerHandlers } from '../../handlers/timerHandlers';
import { examHandlers } from '../../handlers/examHandlers';
import Sidebar from '../layout/Sidebar';
import SidebarPanel from '../exam/SidebarPanel';
import ExamTimer from '../exam/ExamTimer';
import { useExam } from '../state/ExamContext';
import { useAuth } from '../state/AuthContext';
import AttendanceManager from './AttendanceManager';
import IncidentReportPage from '../exam/IncidentReportPage'
import { useTheme } from '../state/ThemeContext';
import DashboardLayout from '../layout/DashboardLayout';

const PROTOCOL_STEPS = [
  { id: 'bags', text: "שלב 1: וודא שכל התיקים והטלפונים מונחים בחזית הכיתה כשהם כבויים. האם סיימת?", options: [{ label: "בוצע, התיקים הונחו", action: "NEXT_STEP" }] },
  { id: 'ids', text: "שלב 2: בדוק תעודות מזהות של כל הסטודנטים. ניתן להשתמש בסורק לקליטה מהירה.", options: [{ label: "הבדיקה הסתיימה", action: "NEXT_STEP" }] },
  { id: 'forms', text: "שלב 3: חלוקת טפסי הבחינה. האם כל הסטודנטים קיבלו טפסים?", options: [{ label: "כן, חילקתי לכולם", action: "FINISH_PROTOCOL" }] }
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
  const [timers, setTimers] = useState([]);
  const [selectedTimerId, setSelectedTimerId] = useState('reg');
  const [botMsg, setBotMsg] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  const classroomData = location.state?.classrooms?.[0] || {};

  // 1. Initial Data Fetching
  useEffect(() => {
    attendanceHandlers.initSupervisorConsole(examId, user.id, setStudents, setLoading, setExamData);
  }, [examId, user.id, setExamData]);

  // 2. Timer Sync Logic
  useEffect(() => {
    const syncTime = async () => {
      const timingData = await timerHandlers.getTimeDataByExamId(examId);
      if (timingData?.start_time && examData?.status === 'active') {
        const startTime = new Date(timingData.start_time).getTime();
        const now = Date.now();
        const baseDurationMin = (timingData.original_duration || 0) + (timingData.extra_time || 0);
        
        const calculateRemaining = (percent) => {
          const totalDuration = baseDurationMin + (timingData.original_duration * percent);
          return Math.max(0, Math.floor(((startTime + totalDuration * 60000) - now) / 1000));
        };

        setTimers([
          { id: 'reg', label: "רגיל (0%)", secs: calculateRemaining(0), color: "#34d399" },
          { id: '25', label: "תוספת 25%", secs: calculateRemaining(0.25), color: "#818cf8" },
          { id: '50', label: "תוספת 50%", secs: calculateRemaining(0.50), color: "#c084fc" }
        ]);
      }
    };
    const interval = setInterval(syncTime, 1000);
    return () => clearInterval(interval);
  }, [examId, examData?.status]);

  // 3. Protocol Management
  useEffect(() => {
    if (!loading && examData) {
      if (['active', 'finished'].includes(examData.status)) {
        setBotMsg({ text: "המבחן פעיל. אני כאן לכל שאלה על סטטיסטיקות או נהלים." });
        setCurrentStep(PROTOCOL_STEPS.length);
      } else if (examData.status === 'pending' && currentStep === 0) {
        setBotMsg(PROTOCOL_STEPS[0]);
      }
    }
  }, [examData, loading]);

  const liveStats = useMemo(() => {
    const total = students.length;
    const out = students.filter(s => s.status === 'exited_temporarily').length;
    const submitted = students.filter(s => s.status === 'submitted').length;
    return {
      total, out, submitted,
      present: total - submitted - out,
      percentFinished: total > 0 ? Math.round((submitted / total) * 100) : 0
    };
  }, [students]);

  const handleFinishExam = async () => {
    if (window.confirm("לסיים את המבחן לכולם?")) {
      await examHandlers.handleChangeStatus(examId, 'finished', setExamData, user.id);
      clearExam();
      navigate('/select-exam');
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
        text: "הפרוטוקול הושלם. מוכן להפעלה.",
        options: [{ label: "הפעל מבחן כעת", action: "START_EXAM" }]
      });
    } else if (action === "START_EXAM") {
      examHandlers.handleChangeStatus(examId, 'active', setExamData).then(() => {
        updateExamStatus('active');
      });
    }
  };

  // --- LOADING GUARD CLAUSE (Correct Placement) ---
  if (loading) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center font-black text-2xl md:text-4xl transition-colors duration-500 
        ${isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
        <div className={`mb-6 w-16 h-16 border-4 rounded-full animate-spin 
          ${isDark ? 'border-emerald-500 border-t-transparent' : 'border-emerald-600 border-t-transparent'}`} 
        />
        <div className="animate-pulse tracking-widest">טוען מערכת...</div>
        {isDark && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[25%] -left-[25%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
          </div>
        )}
      </div>
    );
  }

  // --- COMPONENT PARTS ---

  const sidebarElement = (
    <Sidebar 
      tabs={[
        { id: 'bot', icon: '🤖', label: 'עוזר חכם' }, 
        { id: 'chat', icon: '🏢', label: "קשר מטה" }
      ]} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      isSidebarOpen={isSidebarOpen} 
      setIsSidebarOpen={setIsSidebarOpen} 
      logoText="EX" 
      logoColor="bg-emerald-600"
    >
      <SidebarPanel 
        activeTab={activeTab} 
        userRole="supervisor" 
        externalMessage={botMsg} 
        liveStats={liveStats} // Pass your live stats here
        onAction={handleBotAction} 
        userName={user.full_name} 
      />
    </Sidebar>
  );

const headerElement = (
  <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 justify-between items-center w-full py-2">
    
    {/* TOP ROW: Title & Menu Button */}
    <div className="flex items-center justify-between w-full lg:w-auto gap-3">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className={`lg:hidden p-2 rounded-xl transition-all active:scale-95 ${
            'bg-slate-100 text-slate-600'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className={`text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <h1 className="text-base md:text-xl lg:text-3xl font-black uppercase leading-tight">
            ניהול בחינה
          </h1>
          <p className="md:block text-[10px] lg:text-base text-emerald-500 font-bold">
            {classroomData.examName || '---'} | כיתה {classroomData.room_number || '---'}
          </p>
        </div>
      </div>

      <button 
        onClick={handleFinishExam} 
        className="lg:hidden bg-rose-600 text-white px-4 py-2 rounded-xl font-black text-sm active:scale-95 whitespace-nowrap"
      >
        סיום
      </button>
    </div>

    {/* BOTTOM ROW: Navigation & Timer */}
    {/* Use w-fit on the row container and mx-auto for mobile centering */}
    <div className="flex flex-row items-center justify-center lg:justify-end w-fit lg:w-auto gap-2 md:gap-4 mx-auto lg:mx-0">
      
      {/* Navigation Tabs - Added w-fit */}
      <nav className={`flex transition-all duration-300 border shadow-inner w-fit
        p-1 rounded-xl lg:p-2 lg:rounded-[40px]
        ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'}
      `}>
        <button 
          onClick={() => setDashboardTab('attendance')} 
          className={`font-black transition-all duration-300 
            px-3 py-1.5 rounded-lg text-[11px] 
            md:px-6 md:py-2 md:rounded-[25px] md:text-sm
            lg:px-16 lg:py-6 lg:rounded-[35px] lg:text-2xl
            ${dashboardTab === 'attendance' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-300'}
          `}
        >
          נוכחות
        </button>
        
        <button 
          onClick={() => setDashboardTab('incident')} 
          className={`font-black transition-all duration-300
            px-3 py-1.5 rounded-lg text-[11px] 
            md:px-6 md:py-2 md:rounded-[25px] md:text-sm
            lg:px-16 lg:py-6 lg:rounded-[35px] lg:text-2xl
            ${dashboardTab === 'incident' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-300'}
          `}
        >
          דיווח
        </button>
      </nav>

      {/* Timer Section - w-fit ensures it doesn't expand unnecessarily */}
      {timers.length > 0 && (
        <div className={`flex items-center border shadow-2xl transition-all w-fit
          gap-2 p-1.5 rounded-xl 
          lg:gap-6 lg:p-5 lg:rounded-[40px] lg:border-2
          ${isDark ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200'}
        `}>
          <div className="scale-75 md:scale-90 lg:scale-[1.25] lg:mx-4">
            <ExamTimer 
              key={selectedTimerId} 
              initialSeconds={timers.find(t => t.id === selectedTimerId)?.secs || 0} 
              isPaused={examData?.status !== 'active'} 
            />
          </div>
      
          <div className="flex flex-col gap-0.5 lg:gap-3 lg:border-r lg:border-white/10 lg:pr-6 lg:pl-2">
            {timers.map((t) => (
              <button 
                key={t.id} 
                onClick={() => setSelectedTimerId(t.id)} 
                className={`font-black leading-none transition-all
                  px-1.5 py-0.5 rounded text-[8px] md:text-[10px]
                  lg:px-5 lg:py-2.5 lg:rounded-2xl lg:text-base
                  ${selectedTimerId === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}
                `}
              >
                <span className="lg:hidden">{t.label.replace('תוספת ', '+')}</span>
                <span className="hidden lg:inline whitespace-nowrap">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Finish Button */}
      <button 
        onClick={handleFinishExam} 
        className="hidden lg:block bg-rose-600 text-white lg:px-12 lg:py-5 rounded-[28px] font-black lg:text-2xl hover:bg-rose-500 shadow-xl transition-all active:scale-95 whitespace-nowrap"
      >
        סיום
      </button>
    </div>
  </div>
);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl">טוען...</div>;

  return (
    <DashboardLayout sidebar={sidebarElement} header={headerElement}>
      {dashboardTab === 'attendance' ? (
        <AttendanceManager 
          examId={examId}
          classrooms={classroomData}
          students={students}
          setStudents={setStudents}
          isDark={isDark}
          setBotMsg={setBotMsg}
        />
      ) : (
        <IncidentReportPage 
          examId={examId} 
          classrooms={classroomData} 
          onBack={() => setDashboardTab('attendance')} 
        />
      )}
    </DashboardLayout>
  );
}