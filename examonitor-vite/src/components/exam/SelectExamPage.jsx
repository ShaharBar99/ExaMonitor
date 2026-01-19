import React, { useState, useEffect } from 'react';
import { examHandlers } from '../../handlers/examHandlers';
import { useAuth } from '../state/AuthContext';
import { useTheme } from '../state/ThemeContext';
import Sidebar from '../layout/Sidebar'; // ייבוא הסיידבר המובנה

const SelectExamPage = ({ navigate }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // ניהול מצב הסיידבר

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
        setError("Failed to load exams.");
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

  // הגדרת הטאבים לסיידבר המובנה
  const sidebarTabs = [
  ];

  return (
    <div className={`flex min-h-screen transition-colors ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`} dir="rtl">
      
      {/* שימוש ברכיב ה-Sidebar המובנה שלך */}
      <Sidebar 
        tabs={sidebarTabs} 
        activeTab="exams"
        setActiveTab={() => {}} // דף סטטי, אין צורך בהחלפה
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        logoText="מערכת בחינות"
        logoColor="bg-emerald-600"
        isDark={isDark}
      >
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className={`text-4xl font-black uppercase transition-colors ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Select Exam
              </h1>
              <p className={`font-bold uppercase tracking-[0.2em] text-[10px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                מרכז הבקרה למבחנים פעילים
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="relative group">
              <label className={`block text-[10px] font-black uppercase mb-2 mr-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>חיפוש מהיר</label>
              <input 
                type="text"
                placeholder="שם קורס, קוד או מזהה..."
                className={`w-full py-4 px-8 rounded-2xl font-bold shadow-xl transition-all outline-none border-2 border-transparent ${
                  isDark ? 'bg-slate-900 text-white focus:border-emerald-500/20' : 'bg-white text-slate-800 focus:border-emerald-500/20'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className={`block text-[10px] font-black uppercase mb-2 mr-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>סטטוס מבחן</label>
              <select 
                className={`w-full py-4 px-8 rounded-2xl font-bold shadow-xl outline-none appearance-none cursor-pointer ${
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

          {/* Table */}
          <div className={`rounded-[40px] shadow-2xl overflow-hidden border transition-all ${
            isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'
          }`}>
            <div className={`grid grid-cols-5 gap-4 px-12 py-6 border-b text-[11px] font-black uppercase tracking-widest ${
              isDark ? 'border-white/5 text-slate-400' : 'border-slate-50 text-slate-400'
            }`}>
              <div className="col-span-2">פרטי המבחן</div>
              <div>חדרי בחינה</div>
              <div>מצב</div>
              <div className="text-left">ניהול</div>
            </div>

            <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-50'}`}>
              {filteredExams.map((exam) => (
                <div key={exam.id} className={`grid grid-cols-5 gap-4 px-12 py-8 items-center transition-all group ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}`}>
                  <div className="col-span-2">
                    <div className={`text-xl font-black uppercase group-hover:text-emerald-500 transition-colors ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {exam.courses?.course_name || exam.course_id}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                      ID: {exam.id} • {exam.courses?.course_code}
                    </div>
                  </div>

                  <div className={`text-sm font-black ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {exam.classrooms?.map(c => c.room_number).join(', ') || '---'}
                  </div>

                  <div>
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border flex items-center gap-2 w-fit ${
                      isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      מוכן
                    </span>
                  </div>

                  <div className="text-left">
                    <button 
                      onClick={() => navigate(user?.role === 'lecturer' ? `/Lecturer/lecturerDashboardPage/${exam.id}` : `/exam/active/${exam.id}`, { state: { exam } })}
                      className={`px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
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