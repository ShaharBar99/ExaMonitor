import React, { useState, useEffect } from 'react';
import { examHandlers } from '../../handlers/examHandlers';
import { useAuth } from '../state/AuthContext';

const SelectExamPage = ({ navigate }) => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);


  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        setError(null);
        if(user && user?.role === 'lecturer'){
          const fetchedExams = await examHandlers.fetchExamsWithClassrooms(filterStatus, null, user?.id);
          setExams(fetchedExams);
        } else {
          const fetchedExams = await examHandlers.fetchExamsWithClassrooms(filterStatus, user?.id);
          setExams(fetchedExams);
        }
      } catch (error) {
        console.error("Failed to fetch exams", error);
        setError("Failed to load exams. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, [filterStatus, user?.id]);

  // לוגיקת סינון המבחנים
  const filteredExams = exams.filter(exam => {
    const courseName = exam.courses?.course_name || exam.course_id || '';
    const courseCode = exam.courses?.course_code || '';
    const matchesSearch = courseName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exam.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return <div className="min-h-screen bg-[#0f172a] p-12 text-center text-white">טוען מבחנים...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-[#0f172a] p-12 text-center text-red-400 font-bold">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-12 text-right font-sans" dir="rtl">
      
      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white  uppercase tracking-tight mb-2">
            Select Exam
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
            ניהול ובקרת מבחנים פעילים בזמן אמת
          </p>
        </div>
        <div className="flex gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-slate-500 text-[10px] font-black uppercase">System Online</span>
        </div>
      </div>

      {/* Filters Section - Matching the Image Style */}
      <div className="max-w-6xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative group">
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 mr-4 tracking-widest">חיפוש מבחן</label>
          <input 
            type="text"
            placeholder="חפש לפי שם קורס או מספר חדר..."
            className="w-full bg-white border-2 border-transparent focus:border-emerald-500/20 py-4 px-8 rounded-2xl text-slate-800 font-bold shadow-xl transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-6 top-10.5 opacity-20 group-hover:opacity-100 transition-opacity">🔍</span>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 mr-4 tracking-widest">סינון לפי סטטוס</label>
          <select 
            className="w-full bg-white border-2 border-transparent py-4 px-8 rounded-2xl text-slate-800 font-bold shadow-xl outline-none appearance-none cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">כל המבחנים הזמינים</option>
            <option value="active">מבחנים פעילים</option>
            <option value="scheduled">מבחנים עתידיים</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="max-w-6xl mx-auto bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white/10">
        
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 px-12 py-6 border-b border-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <div className="col-span-2">פרטי המבחן והקורס</div>
          <div>מיקום</div>
          <div>סטטוס מערכת</div>
          <div className="text-left">פעולות ניהול</div>
        </div>

        {/* Exams List */}
        <div className="divide-y divide-slate-50">
          {filteredExams.map((exam) => (
            <div 
              key={exam.id} 
              className="grid grid-cols-5 gap-4 px-12 py-8 items-center hover:bg-slate-50/50 transition-all group"
            >
              {/* Exam Name & ID */}
              <div className="col-span-2">
                <div className="text-xl font-black text-slate-800  uppercase leading-tight group-hover:text-emerald-600 transition-colors">
                  {exam.courses?.course_name || exam.course_id}
                </div>
                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                  Course Code: {exam.courses?.course_code || 'N/A'} • Exam ID: {exam.id}
                </div>
              </div>

              {/* Room Info */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">🏠</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">חדרים</p>
                    <p className="text-sm font-black text-slate-700">
                      {exam.classrooms && exam.classrooms.length > 0 
                        ? exam.classrooms.map(c => c.room_number || c.id).join(', ')
                        : 'אין חדרים שהוקצו'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-emerald-100 shadow-sm inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  מוכן לשידור
                  
                </span>
              </div>

              {/* Action Button */}
              <div className="text-left">
                {user?.role === 'lecturer' ? (
                  <button 
                    onClick={() => navigate(`/Lecturer/lecturerDashboardPage/${exam.id}`, { state: { exam, classrooms: exam.classrooms } })}
                    className="bg-[#0f172a] hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-3 mr-auto"
                  >
                    כניסה למערכת (מרצה)
                    <span className="text-lg">←</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate(`/exam/active/${exam.id}`, { state: { exam, classrooms: exam.classrooms } })}
                    className="bg-[#0f172a] hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-3 mr-auto"
                  >
                    כניסה למערכת
                    <span className="text-lg">←</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredExams.length === 0 && (
          <div className="p-32 text-center">
            <div className="text-5xl mb-4 opacity-20">📂</div>
            <p className="text-slate-300  font-black text-xl uppercase tracking-widest">
              No matching exams found
            </p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 text-emerald-500 font-bold text-sm underline"
            >
              נקה חיפוש
            </button>
          </div>
        )}
      </div>
      
      {/* Footer Branding */}
      <div className="max-w-6xl mx-auto mt-12 flex justify-between items-center opacity-30">
        <div className="flex gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            <span>Security Protocol v4.1</span>
            <span>Server: ISL-01</span>
        </div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
          Exam Selection Terminal Console
        </p>
      </div>
    </div>
  );
};

export default SelectExamPage;