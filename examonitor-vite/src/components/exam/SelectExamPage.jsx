import React, { useState, useEffect } from 'react';
import { examHandlers } from '../../handlers/examHandlers';
import { useAuth } from '../state/AuthContext';
import { useTheme } from '../state/ThemeContext';
import Sidebar from '../layout/Sidebar'; 

const SelectExamPage = ({ navigate }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedExams = await examHandlers.fetchExamsWithClassrooms(
          filterStatus, 
          user?.role === 'lecturer' ? null : user?.id, 
          user?.role === 'lecturer' ? user?.id : null
        );
        setExams(fetchedExams);
      } catch (error) {
        console.error("Failed to fetch exams", error);
        setError("שגיאה בטעינת המבחנים.");
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, [filterStatus, user?.id, user?.role]);

  const filteredExams = exams.filter(exam => {
    const courseName = (exam.courses?.course_name || exam.course_id || '').toLowerCase();
    const courseCode = (exam.courses?.course_code || '').toLowerCase();
    const id = exam.id.toLowerCase();
    const term = searchTerm.toLowerCase();
    return courseName.includes(term) || courseCode.includes(term) || id.includes(term);
  });

  const sidebarTabs = [];

  return (
    <div className={`flex min-h-screen transition-colors ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`} dir="rtl">
      
      <Sidebar 
        tabs={sidebarTabs} 
        activeTab="exams"
        setActiveTab={() => {}} 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        logoText="מערכת בחינות"
        logoColor="bg-emerald-600"
        isDark={isDark}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 lg:p-12 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto mt-14 sm:mt-0">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 sm:mb-10 gap-4">
            <div>
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black uppercase transition-colors ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Select Exam
              </h1>
              <p className={`font-bold uppercase tracking-widest sm:tracking-[0.2em] text-[10px] sm:text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                מרכז הבקרה למבחנים פעילים
              </p>
            </div>
            
            {/* Mobile Sidebar Toggle - Only visible if sidebar isn't already handled by layout */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-3 rounded-xl bg-emerald-500 text-white shadow-lg"
            >
              ☰ תפריט
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="relative group">
              <label className={`block text-[10px] font-black uppercase mb-2 mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>חיפוש מהיר</label>
              <input 
                type="text"
                placeholder="שם קורס, קוד או מזהה..."
                className={`w-full py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-bold shadow-xl transition-all outline-none border-2 border-transparent text-sm sm:text-base ${
                  isDark ? 'bg-slate-900 text-white focus:border-emerald-500/20' : 'bg-white text-slate-800 focus:border-emerald-500/20'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className={`block text-[10px] font-black uppercase mb-2 mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>סטטוס מבחן</label>
              <select 
                className={`w-full py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-bold shadow-xl outline-none appearance-none cursor-pointer text-sm sm:text-base ${
                  isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'
                }`}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">כל המבחנים</option>
                <option value="active">פעילים כעת</option>
              </select>
            </div>
          </div>

          {/* Exams List Container */}
          <div className={`rounded-2xl sm:rounded-[40px] shadow-2xl overflow-hidden border transition-all ${
            isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'
          }`}>
            
            {/* Desktop Table Header - Hidden on Mobile */}
            <div className={`hidden md:grid grid-cols-5 gap-4 px-12 py-6 border-b text-[11px] font-black uppercase tracking-widest ${
              isDark ? 'border-white/5 text-slate-400' : 'border-slate-50 text-slate-400'
            }`}>
              <div className="col-span-2">פרטי המבחן</div>
              <div>חדרי בחינה</div>
              <div>מצב</div>
              <div className="text-left">ניהול</div>
            </div>

            {/* List Body */}
            <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-50'}`}>
              {loading ? (
                <div className="p-20 text-center font-black uppercase tracking-widest text-slate-500">טוען נתונים...</div>
              ) : filteredExams.length === 0 ? (
                <div className="p-20 text-center font-black uppercase tracking-widest text-slate-500">לא נמצאו מבחנים</div>
              ) : filteredExams.map((exam) => (
                <div key={exam.id} className={`flex flex-col md:grid md:grid-cols-5 gap-4 px-6 sm:px-12 py-6 sm:py-8 items-start md:items-center transition-all group ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}`}>
                  
                  {/* Course Details */}
                  <div className="md:col-span-2">
                    <div className={`text-lg sm:text-xl font-black uppercase group-hover:text-emerald-500 transition-colors ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {exam.courses?.course_name || exam.course_id}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                      ID: {exam.id} • {exam.courses?.course_code}
                    </div>
                  </div>

                  {/* Classrooms */}
                  <div className="flex md:block items-center gap-2">
                    <span className="md:hidden text-[10px] font-black text-slate-500 uppercase">חדרים:</span>
                    <div className={`text-sm font-black ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {exam.classrooms?.map(c => c.room_number).join(', ') || '---'}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span className={`px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase border flex items-center gap-2 w-fit ${
                      isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      מוכן
                    </span>
                  </div>

                  {/* Action Button */}
                  <div className="text-left w-full md:w-auto mt-4 md:mt-0">
                    <button 
                      onClick={() => navigate(user?.role === 'lecturer' ? `/Lecturer/lecturerDashboardPage/${exam.id}` : `/exam/active/${exam.id}`, { state: { exam, classrooms: exam.classrooms } })}
                      className={`w-full md:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                        isDark ? 'bg-white text-slate-900 hover:bg-emerald-400' : 'bg-[#0f172a] text-white hover:bg-emerald-600'
                      }`}
                    >
                      כניסה ←
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SelectExamPage;