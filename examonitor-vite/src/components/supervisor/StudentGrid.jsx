import React, { useState } from 'react';
import StudentCard from './StudentCard';

const StudentGrid = ({ students, onStatusChange }) => {
  const [search, setSearch] = useState('');

  const filteredStudents = students.filter(s => 
    s.name.includes(search) || s.id.includes(search)
  );

  return (
    <div className="flex flex-col h-full bg-transparent" dir="rtl">
      {/* שורת חיפוש - סגנון מינימליסטי */}
      <div className="mb-10 relative max-w-xl">
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 text-xl">🔍</span>
        <input 
          type="text" 
          placeholder="חפש סטודנט לפי שם או תעודת זהות..."
          className="w-full pr-14 pl-6 py-5 rounded-[22px] bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white text-slate-700 font-bold shadow-sm outline-none transition-all  text-sm"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* פריסת הגריד */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredStudents.map(student => (
          <StudentCard 
            key={student.id} 
            student={student} 
            onStatusChange={onStatusChange} 
          />
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 opacity-20">
          <span className="text-6xl mb-4">👤</span>
          <p className="text-slate-900 font-black  uppercase tracking-widest text-xl">לא נמצאו סטודנטים</p>
        </div>
      )}
    </div>
  );
};

export default StudentGrid;