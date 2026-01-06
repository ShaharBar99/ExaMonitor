import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RoomGrid from './RoomGrid';
import { classroomHandler } from '../../handlers/classroomHandler'; // שימוש ב-Handler החדש
import { useExam } from '../state/ExamContext';
import {useAuth} from '../state/AuthContext';
export default function ViewClassroomsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { examData } = useExam();
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  // זיהוי תפקיד המשתמש
  const userRole = user?.role || 'floor_manager'; 
  const isLecturer = userRole === 'lecturer';
  
  const [classrooms, setClassrooms] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // טעינת נתונים באמצעות ה-Handler של ה-Classrooms
  useEffect(() => {
    // ה-Handler יבצע את הסינון הפנימי: 
    // למרצה הוא יביא רק את כיתות המבחן שלו, למשגיח את כל מה שהוא מורשה
    classroomHandler.loadDisplayData(
      userRole, 
      examData?.courseName, 
      setClassrooms, 
      setLoading
    );
  }, [userRole, examData]);

  // סינון מקומי לצורך שורת החיפוש (UI בלבד)
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter(room => {
      const matchesSearch = 
        room.examName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.id.toString().includes(searchQuery);
        
      return matchesSearch;
    });
  }, [classrooms, searchQuery]);

  // עדכון משגיח דרך ה-Handler של ה-Classrooms
  const onSupervisorChange = (classroomId, supervisorId) => {
    if (isLecturer) return;

    classroomHandler.handleAssign(classroomId, supervisorId, () => {
      // רענון הנתונים מהשרת לאחר עדכון מוצלח
      classroomHandler.loadDisplayData(userRole, examData?.courseName, setClassrooms);
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-black uppercase tracking-[0.3em]">
      טוען פריסת כיתות...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] p-12 text-right text-white font-sans" dir="rtl">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-12 bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => navigate(-1)} 
            className="p-5 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/10 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rotate-180 transition-transform group-hover:-translate-x-1 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div>
            <h1 className="text-4xl font-black tracking-tight uppercase">
              {isLecturer ? `מעקב כיתות: ${examData?.courseName || 'המבחן שלי'}` : 'ניהול כיתות ובקרה'}
            </h1>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mt-2 opacity-70">
              {isLecturer ? 'סטטוס התקדמות בחדרי הבחינה' : 'תצוגת כיתות פעילות ושיבוץ משגיחים'}
            </p>
          </div>
        </div>

        {!isLecturer && (
          <div className="relative w-96">
            <input 
              type="text"
              placeholder="חפש מספר חדר או שם מבחן..."
              className="w-full bg-white border-2 border-white/10 focus:border-indigo-500 rounded-2xl py-4 px-12 font-bold text-sm text-black outline-none transition-all placeholder:text-slate-500"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60">🔍</span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={`bg-white rounded-[50px] p-12 shadow-2xl ${isLecturer ? 'max-w-6xl mx-auto' : ''}`}>
        <div className="mb-8 flex justify-between items-center border-b border-slate-100 pb-8">
            <h2 className="text-2xl font-black text-slate-800 uppercase">פריסת חדרים</h2>
            <div className="flex gap-4">
                <LegendItem color="bg-emerald-500" label="פעיל" />
                <LegendItem color="bg-amber-500" label="אזהרה" />
                <LegendItem color="bg-slate-200" label="ממתין" />
            </div>
        </div>

        <RoomGrid 
          rooms={filteredClassrooms} 
          onSupervisorChange={!isLecturer ? onSupervisorChange : null} 
          readOnly={isLecturer} 
        />

        {isLecturer && (
          <div className="mt-12 p-8 bg-rose-50 rounded-[30px] border-2 border-rose-100 flex items-center gap-6">
            <span className="text-3xl">ℹ️</span>
            <div>
                <p className="text-rose-800 font-black text-lg">מצב תצוגה בלבד</p>
                <p className="text-rose-600/80 font-bold text-sm">המידע מסונן עבור המבחן שלך בלבד. לשינויים בשיבוץ יש לפנות למנהל הקומה.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-full ${color}`}></div>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);