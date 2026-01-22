import React, { useState } from 'react';
import StudentCard from './StudentCard';
import { useTheme } from '../state/ThemeContext';

const StudentGrid = ({ students, onStatusChange, onMoveClass }) => {
  const [search, setSearch] = useState('');
  const { isDark } = useTheme();

  const filteredStudents = students.filter(s => 
    s.name.includes(search) || s.studentId?.includes(search)
  );

  return (
    <div className="flex flex-col h-full bg-transparent" dir="rtl">
      
      {/* Search Bar - Responsive spacing and font sizing */}
      <div className="mb-6 md:mb-12 relative w-full lg:max-w-2xl">
        <span className={`absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-xl md:text-3xl transition-colors ${
          isDark ? 'text-slate-500' : 'text-slate-300'
        }`}>
          🔍
        </span>
        <input 
          type="text" 
          placeholder="חפש סטודנט לפי שם או תעודת זהות..."
          className={`w-full pr-12 md:pr-16 pl-6 md:pl-8 py-4 md:py-7 rounded-[20px] md:rounded-[30px] border-2 md:border-4 outline-none transition-all font-black text-lg md:text-2xl shadow-xl ${
            isDark 
            ? 'bg-slate-800 border-white/5 focus:border-emerald-500/40 text-white placeholder:text-slate-500' 
            : 'bg-slate-100 text-slate-700 placeholder:text-slate-400'
          }`}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid Layout - Better breakpoint handling for smaller tablets and phones */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4 md:gap-8 pb-10">
        {filteredStudents.map(student => (
          <StudentCard 
            key={student.id} 
            student={student} 
            onStatusChange={onStatusChange} 
            onMoveClass={onMoveClass}
          />
        ))}
      </div>

      {/* Empty State - Scaled down for mobile */}
      {filteredStudents.length === 0 && (
        <div className={`flex flex-col items-center justify-center py-16 md:py-32 transition-opacity ${
          isDark ? 'opacity-20' : 'opacity-30'
        }`}>
          <span className="text-6xl md:text-9xl mb-4 md:mb-6">👤</span>
          <p className={`font-black uppercase tracking-widest text-xl md:text-4xl text-center px-4 ${
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