import React, { useState } from 'react';
import StudentCard from './StudentCard';
import { useTheme } from '../state/ThemeContext'; // ייבוא ה-Theme

const StudentGrid = ({ students, onStatusChange, onMoveClass }) => {
  const [search, setSearch] = useState('');
  const { isDark } = useTheme(); // שימוש בסטטוס ה-Dark Mode

  const filteredStudents = students.filter(s => 
    s.name.includes(search) || s.studentId?.includes(search)
  );

  return (
    <div className="flex flex-col h-full bg-transparent" dir="rtl">
      
      {/* שורת חיפוש מותאמת */}
      <div className="mb-12 relative max-w-2xl">
        <span className={`absolute right-6 top-1/2 -translate-y-1/2 text-3xl transition-colors ${
          isDark ? 'text-slate-500' : 'text-slate-300'
        }`}>
          🔍
        </span>
        <input 
          type="text" 
          placeholder="חפש סטודנט לפי שם או תעודת זהות..."
          className={`w-full pr-16 pl-8 py-7 rounded-[30px] border-4 outline-none transition-all font-black text-2xl shadow-xl ${
            isDark 
            ? 'bg-slate-800 border-white/5 focus:border-emerald-500/40 text-white placeholder:text-slate-500' 
            : 'bg-slate-50 border-slate-100 focus:border-emerald-500/20 text-slate-700 placeholder:text-slate-300'
          }`}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* פריסת הגריד */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
        {filteredStudents.map(student => (
          <StudentCard 
            key={student.id} 
            student={student} 
            onStatusChange={onStatusChange} 
            onMoveClass={onMoveClass}
          />
        ))}
      </div>

      {/* הודעת אין תוצאות */}
      {filteredStudents.length === 0 && (
        <div className={`flex flex-col items-center justify-center py-32 transition-opacity ${
          isDark ? 'opacity-20' : 'opacity-30'
        }`}>
          <span className="text-9xl mb-6">👤</span>
          <p className={`font-black uppercase tracking-widest text-4xl ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            לא נמצאו סטודנטים
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentGrid;