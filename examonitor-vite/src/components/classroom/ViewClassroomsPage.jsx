import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RoomGrid from './RoomGrid';
import { classroomHandler } from '../../handlers/classroomHandlers';
import { useExam } from '../state/ExamContext';
import { useAuth } from '../state/AuthContext';
import { useTheme } from '../state/ThemeContext'; // ייבוא ה-Theme

export default function ViewClassroomsPage() {
  const navigate = useNavigate();
  const { examData } = useExam();
  const { user } = useAuth();
  const { isDark } = useTheme(); // שימוש בערך ה-Theme

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
    <div className={`min-h-screen flex items-center justify-center font-black uppercase tracking-[0.3em] transition-colors ${
      isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      טוען פריסת כיתות...
    </div>
  );

  return (
    <div className={`min-h-screen p-12 text-right font-sans transition-colors ${
      isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'
    }`} dir="rtl">
      
      {/* Header - Glassmorphism מותאם */}
      <header className={`flex justify-between items-center mb-12 p-8 rounded-[40px] border backdrop-blur-md transition-all ${
        isDark 
          ? 'bg-white/5 border-white/10 shadow-none' 
          : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
      }`}>
        <div className="flex items-center gap-8">
          <div>
            <h1 className={`text-4xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {isLecturer ? `מעקב כיתות: ${examData?.courseName || 'המבחן שלי'}` : 'ניהול כיתות ובקרה'}
            </h1>
            <p className={`font-black uppercase tracking-[0.2em] text-[10px] mt-2 ${isDark ? 'text-slate-400 opacity-70' : 'text-slate-500'}`}>
              {isLecturer ? 'סטטוס התקדמות בחדרי הבחינה' : 'תצוגת כיתות פעילות ושיבוץ משגיחים'}
            </p>
          </div>
        </div>

        {!isLecturer && (
          <div className="relative w-96">
            <input 
              type="text"
              placeholder="חפש מספר חדר או שם מבחן..."
              className={`w-full rounded-2xl py-4 px-12 font-bold text-sm outline-none transition-all ${
                isDark 
                  ? 'bg-slate-800 border-2 border-slate-700 text-white focus:border-indigo-500 placeholder:text-slate-500' 
                  : 'bg-slate-100 border-2 border-transparent focus:bg-white focus:border-indigo-500 text-slate-900 placeholder:text-slate-400'
              }`}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60">🔍</span>
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className={`rounded-[50px] p-12 transition-all ${
        isDark 
          ? 'bg-slate-900/50 border border-slate-800 shadow-none' 
          : 'bg-white shadow-2xl shadow-slate-200 border border-slate-100'
      } ${isLecturer ? 'max-w-6xl mx-auto' : ''}`}>
        
        <div className={`mb-8 flex justify-between items-center border-b pb-8 transition-colors ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
            <h2 className={`text-2xl font-black uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>פריסת חדרים</h2>
            <div className="flex gap-4">
                <LegendItem color="bg-emerald-500" label="פעיל" isDark={isDark} />
                <LegendItem color="bg-amber-500" label="אזהרה" isDark={isDark} />
                <LegendItem color="bg-slate-300" label="ממתין" isDark={isDark} />
            </div>
        </div>

        {/* שים לב: צריך לוודא שגם RoomGrid מקבל isDark אם הוא מכיל אלמנטים פנימיים */}
        <RoomGrid 
          rooms={filteredClassrooms} 
          supervisors={supervisors}
          onSupervisorChange={!isLecturer ? onSupervisorChange : null} 
          readOnly={isLecturer} 
          isDark={isDark} 
        />

        {isLecturer && (
          <div className={`mt-12 p-8 rounded-[30px] border-2 flex items-center gap-6 transition-all ${
            isDark 
              ? 'bg-indigo-500/5 border-indigo-500/20' 
              : 'bg-rose-50 border-rose-100'
          }`}>
            <span className="text-3xl">ℹ️</span>
            <div>
                <p className={`font-black text-lg ${isDark ? 'text-indigo-400' : 'text-rose-800'}`}>מצב תצוגה בלבד</p>
                <p className={`font-bold text-sm ${isDark ? 'text-slate-400' : 'text-rose-600/80'}`}>
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
    <div className={`w-3 h-3 rounded-full ${color}`}></div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${
      isDark ? 'text-slate-500' : 'text-slate-400'
    }`}>
      {label}
    </span>
  </div>
);