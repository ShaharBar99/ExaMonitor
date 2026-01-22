import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoomGrid from './RoomGrid';
import { classroomHandler } from '../../handlers/classroomHandlers';
import { useExam } from '../state/ExamContext';
import { useAuth } from '../state/AuthContext';
import { useTheme } from '../state/ThemeContext';

export default function ViewClassroomsPage() {
  const navigate = useNavigate();
  const { examData } = useExam();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const userRole = user?.role || 'floor_supervisor'; 
  const isLecturer = userRole === 'lecturer';
  
  const [classrooms, setClassrooms] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [supervisors, setSupervisors] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (isLecturer) {
        if (examData?.id) {
          classroomHandler.loadDisplayData(userRole, examData.id, examData?.courseName || null, setClassrooms, setLoading);
        } else if (user?.id) {
          classroomHandler.loadDisplayData(userRole, null, null, setClassrooms, setLoading, user.id);
        } else {
          setClassrooms([]);
          setLoading(false);
        }
      } else {
        await classroomHandler.loadDisplayData(userRole, examData?.id || null, examData?.courseName || null, setClassrooms, setLoading);
        if (!isLecturer) {
          try {
            const supervisorsData = await classroomHandler.loadSupervisors();
            setSupervisors(supervisorsData);
          } catch (error) {
            console.error('Failed to load supervisors:', error);
          }
        }
      }
    };
    fetchData();
  }, [userRole, examData, user, isLecturer]);

  const filteredClassrooms = useMemo(() => {
    return classrooms.filter(room => {
      const query = searchQuery.toLowerCase();
      return (
        room.examName?.toLowerCase().includes(query) ||
        room.room_number?.toString().includes(query) ||
        room.id.toString().includes(query)
      );
    });
  }, [classrooms, searchQuery]);

  const onSupervisorChange = (classroomId, supervisorId) => {
    if (isLecturer) return;
    classroomHandler.handleAssign(classroomId, supervisorId, () => {
      classroomHandler.loadDisplayData(userRole, examData?.id || null, examData?.courseName || null, setClassrooms);
    });
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center font-black uppercase tracking-[0.2em] p-6 text-center transition-colors ${
      isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      טוען פריסת כיתות...
    </div>
  );

  return (
    <div className={`min-h-screen p-4 md:p-8 lg:p-12 text-right font-sans transition-colors ${
      isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'
    }`} dir="rtl">
      
      {/* Header - Stacks on mobile */}
      <header className={`flex flex-col lg:flex-row justify-between items-center mb-6 md:mb-12 p-6 md:p-8 rounded-[30px] md:rounded-[40px] border backdrop-blur-md transition-all gap-6 ${
        isDark 
          ? 'bg-white/5 border-white/10' 
          : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
      }`}>
        <div className="w-full lg:w-auto">
          <h1 className={`text-2xl md:text-4xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {isLecturer ? `מעקב כיתות: ${examData?.courseName || 'המבחן שלי'}` : 'ניהול כיתות ובקרה'}
          </h1>
          <p className={`font-black uppercase tracking-widest text-[9px] md:text-[10px] mt-2 ${isDark ? 'text-slate-400 opacity-70' : 'text-slate-500'}`}>
            {isLecturer ? 'סטטוס התקדמות בחדרי הבחינה' : 'תצוגת כיתות פעילות ושיבוץ משגיחים'}
          </p>
        </div>

        {!isLecturer && (
          <div className="relative w-full lg:w-96">
            <input 
              type="text"
              placeholder="חפש מספר חדר או שם מבחן..."
              className={`w-full rounded-2xl py-3 md:py-4 px-12 font-bold text-sm outline-none transition-all ${
                isDark 
                  ? 'bg-slate-800 border-2 border-slate-700 text-white focus:border-indigo-500 placeholder:text-slate-500' 
                  : 'bg-slate-100 border-2 border-transparent focus:bg-white focus:border-indigo-500 text-slate-900'
              }`}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60">🔍</span>
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className={`rounded-[35px] md:rounded-[50px] p-6 md:p-12 transition-all ${
        isDark 
          ? 'bg-slate-900/50 border border-slate-800' 
          : 'bg-white shadow-2xl shadow-slate-200 border border-slate-100'
      } ${isLecturer ? 'max-w-6xl mx-auto' : ''}`}>
        
        <div className={`mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-6 md:pb-8 gap-4 transition-colors ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
            <h2 className={`text-xl md:text-2xl font-black uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>פריסת חדרים</h2>
            <div className="flex flex-wrap gap-4">
                <LegendItem color="bg-emerald-500" label="פעיל" isDark={isDark} />
                <LegendItem color="bg-amber-500" label="אזהרה" isDark={isDark} />
                <LegendItem color="bg-slate-300" label="ממתין" isDark={isDark} />
            </div>
        </div>

        <RoomGrid 
          rooms={filteredClassrooms} 
          supervisors={supervisors}
          onSupervisorChange={!isLecturer ? onSupervisorChange : null} 
          readOnly={isLecturer} 
          isDark={isDark} 
        />

        {isLecturer && (
          <div className={`mt-8 md:mt-12 p-6 md:p-8 rounded-[25px] md:rounded-[30px] border-2 flex flex-col sm:flex-row items-center gap-4 md:gap-6 transition-all ${
            isDark 
              ? 'bg-indigo-500/5 border-indigo-500/20' 
              : 'bg-rose-50 border-rose-100'
          }`}>
            <span className="text-3xl">ℹ️</span>
            <div className="text-center sm:text-right">
                <p className={`font-black text-base md:text-lg ${isDark ? 'text-indigo-400' : 'text-rose-800'}`}>מצב תצוגה בלבד</p>
                <p className={`font-bold text-xs md:text-sm ${isDark ? 'text-slate-400' : 'text-rose-600/80'}`}>
                  המידע מסונן עבור המבחן שלך בלבד. לשינויים בשיבוץ יש לפנות למנהל הקומה.
                </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const LegendItem = ({ color, label, isDark }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${
      isDark ? 'text-slate-500' : 'text-slate-400'
    }`}>
      {label}
    </span>
  </div>
);