import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RoomGrid from '../../components/exam/RoomGrid';
import { INITIAL_ROOMS, AVAILABLE_SUPERVISORS } from '../../mocks/floorSupervisor_MockData';
import { useExam } from '../../state/ExamContext';

export default function ViewClassroomsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { examData } = useExam();
  
  const userRole = location.state?.role || 'floor_manager'; 
  const isLecturer = userRole === 'lecturer';
  
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [searchQuery, setSearchQuery] = useState('');

  // לוגיקת סינון מאוחדת - מונעת כפילות
  const filteredRooms = useMemo(() => {
    const targetExam = examData?.courseName || "מבוא למדעי המחשב";
    
    return rooms.filter(room => {
      const matchesRole = !isLecturer || room.examName === targetExam;
      const matchesSearch = room.id.includes(searchQuery) || 
                            room.examName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [rooms, searchQuery, isLecturer, examData]);

  // הגדרות עיצוב דינמיות
  const config = {
    accentColor: isLecturer ? 'rose' : 'indigo',
    title: isLecturer ? `מעקב חדרים: ${examData?.courseName || 'המבחן שלי'}` : 'פריסת חדרים בקומה',
    subtitle: isLecturer ? 'צפייה בסטטוס התקדמות לפי חדר' : 'ניהול ובקרת משגיחים בקומה'
  };

  const handleSupervisorChange = (id, sup) => {
    if (isLecturer) return; // הגנה נוספת ברמת הלוגיקה
    setRooms(prev => prev.map(r => r.id === id ? {...r, supervisor: sup} : r));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-12 text-right text-white font-sans" dir="rtl">
      
      {/* Header מעודכן לשפה העיצובית החדשה */}
      <header className="flex justify-between items-center mb-12 bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => navigate(-1)} 
            className="p-5 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/10 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 rotate-180 transition-transform group-hover:-translate-x-1 ${isLecturer ? 'text-rose-400' : 'text-indigo-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div>
            <h1 className="text-4xl font-black italic tracking-tight uppercase">{config.title}</h1>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mt-2 opacity-70">
              {config.subtitle}
            </p>
          </div>
        </div>

        {!isLecturer && (
          <div className="relative w-96">
            <input 
              type="text"
              placeholder="חפש חדר או מבחן..."
              className="w-full bg-white/5 border-2 border-white/10 focus:border-indigo-500 rounded-2xl py-4 px-12 font-bold text-sm outline-none transition-all placeholder:text-slate-500"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
          </div>
        )}
      </header>

      {/* אזור התוכן המרכזי */}
      <main className={`bg-white rounded-[50px] p-12 shadow-2xl ${isLecturer ? 'max-w-6xl mx-auto' : ''}`}>
        <div className="mb-8 flex justify-between items-center border-b border-slate-100 pb-8">
            <h2 className="text-2xl font-black text-slate-800 uppercase italic">Classroom Layout</h2>
            <div className="flex gap-4">
                <LegendItem color="bg-emerald-500" label="פעיל" />
                <LegendItem color="bg-amber-500" label="בהפסקה" />
                <LegendItem color="bg-slate-200" label="ממתין" />
            </div>
        </div>

        <RoomGrid 
          rooms={filteredRooms} 
          supervisors={AVAILABLE_SUPERVISORS} 
          onSupervisorChange={!isLecturer ? handleSupervisorChange : null} 
          readOnly={isLecturer} 
        />

        {isLecturer && (
          <div className="mt-12 p-8 bg-rose-50 rounded-[30px] border-2 border-rose-100 flex items-center gap-6">
            <span className="text-3xl">ℹ️</span>
            <div>
                <p className="text-rose-800 font-black text-lg">מצב תצוגה בלבד</p>
                <p className="text-rose-600/80 font-bold text-sm">לשינוי הקצאת משגיחים או חדרים, יש ליצור קשר עם מנהל הקומה בפורטל השליטה.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// רכיב עזר קטן למקרא - שומר על ה-Return נקי
const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-full ${color}`}></div>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);