import React, { useState } from 'react';
import StudentCard from './StudentCard';

const StudentGrid = ({ students, onStatusChange , onMoveClass}) => {
  const [search, setSearch] = useState('');

  const filteredStudents = students.filter(s => 
    s.name.includes(search) || s.studentId?.includes(search)
  );

  return (
    <div className="flex flex-col h-full bg-transparent" dir="rtl">
      {/* שורת חיפוש - מוגדלת משמעותית */}
      <div className="mb-12 relative max-w-2xl">
        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 text-3xl">🔍</span>
        <input 
          type="text" 
          placeholder="חפש סטודנט לפי שם או תעודת זהות..."
          className="w-full pr-16 pl-8 py-7 rounded-[30px] bg-white border-4 border-transparent focus:border-emerald-500/20 shadow-xl text-slate-700 font-black text-2xl outline-none transition-all placeholder:text-slate-300"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* פריסת הגריד - ריווח מוגדל בין כרטיסים */}
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

      {filteredStudents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 opacity-30">
          <span className="text-9xl mb-6">👤</span>
          <p className="text-slate-900 font-black uppercase tracking-widest text-4xl">לא נמצאו סטודנטים</p>
        </div>
      )}
    </div>
  );
};

export default StudentGrid;