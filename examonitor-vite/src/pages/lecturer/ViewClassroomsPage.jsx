import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RoomGrid from '../../components/exam/RoomGrid';
import { INITIAL_ROOMS, AVAILABLE_SUPERVISORS } from '../../mocks/floorSupervisor_MockData';
import { useExam } from '../../state/ExamContext'; // ייבוא חובה

export default function ViewClassroomsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { examData } = useExam(); // שליפת נתוני המבחן האמיתיים
  
  const userRole = location.state?.role || 'floor_manager'; 
  
  // שימוש בשם המבחן מה-Context, ואם אין - שימוש בברירת מחדל
  const lecturerExamName = examData?.courseName || "מבוא למדעי המחשב"; 

  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = useMemo(() => {
    let baseRooms = rooms;

    // עכשיו הסינון יתבסס על המבחן שהמרצה באמת מנהל
    if (userRole === 'lecturer') {
      baseRooms = rooms.filter(room => room.examName === lecturerExamName);
    }

    return baseRooms.filter(room => 
      room.id.includes(searchQuery) || 
      room.examName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rooms, searchQuery, userRole, lecturerExamName]);

  const theme = {
    color: userRole === 'lecturer' ? 'rose' : 'indigo',
    title: userRole === 'lecturer' ? `מעקב חדרים: ${lecturerExamName}` : 'פריסת חדרים בקומה',
    canEdit: userRole === 'floor_manager'
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-12 text-right" dir="rtl">
      
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)} 
            className="p-4 bg-white rounded-2xl shadow-sm hover:bg-slate-50 transition-all border border-slate-100"
          >
            {/* תיקון צבע דינמי לחץ החזרה */}
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 rotate-180 ${userRole === 'lecturer' ? 'text-rose-600' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-4xl font-black text-slate-800 italic tracking-tight">{theme.title}</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
              {userRole === 'lecturer' ? 'צפייה בסטטוס התקדמות לפי חדר' : 'ניהול ובקרת משגיחים בקומה'}
            </p>
          </div>
        </div>

        {userRole === 'floor_manager' && (
          <div className="relative w-96">
            <input 
              type="text"
              placeholder="חפש חדר, מבחן או משגיח..."
              className="w-full bg-white border-2 border-slate-100 focus:border-indigo-500 rounded-3xl py-4 px-12 font-bold text-sm outline-none shadow-sm transition-all"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
          </div>
        )}
      </header>

      <div className={`${userRole === 'lecturer' ? 'max-w-5xl mx-auto' : ''}`}>
        <RoomGrid 
          rooms={filteredRooms} 
          supervisors={AVAILABLE_SUPERVISORS} 
          onSupervisorChange={theme.canEdit ? (id, sup) => {
            setRooms(prev => prev.map(r => r.id === id ? {...r, supervisor: sup} : r))
          } : null} 
          readOnly={!theme.canEdit} 
        />
      </div>

      {userRole === 'lecturer' && (
        <div className="mt-8 p-6 bg-rose-50 rounded-[30px] border border-rose-100 text-rose-700 font-bold text-center">
          שים לב: מבט זה מיועד למעקב בלבד. לשינוי משגיחים או הקצאת חדרים יש לפנות למנהל הקומה.
        </div>
      )}
    </div>
  );
}