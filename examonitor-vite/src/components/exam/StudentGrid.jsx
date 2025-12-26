import React, { useState } from 'react';
import StudentCard from './StudentCard';

const StudentGrid = ({ students, onStatusChange }) => {
  const [search, setSearch] = useState('');

  // לוגיקת סינון בזמן אמת
  const filteredStudents = students.filter(s => 
    s.name.includes(search) || s.id.includes(search)
  );

  return (
    <div className="flex flex-col h-full">
      {/* שורת חיפוש */}
      <div className="mb-6 sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md py-2">
        <div className="relative max-w-md mx-auto">
          <input 
            type="text" 
            placeholder="חפש סטודנט לפי שם או תעודת זהות..."
            className="w-full pl-4 pr-10 py-3 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 text-sm outline-none"
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ה-Grid עצמו */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredStudents.map(student => (
          <StudentCard 
            key={student.id} 
            student={student} 
            onStatusChange={onStatusChange} 
          />
        ))}
      </div>

      {/* הודעה כשאין תוצאות */}
      {filteredStudents.length === 0 && (
        <div className="text-center py-20 text-slate-400 font-medium">
          לא נמצאו סטודנטים התואמים לחיפוש...
        </div>
      )}
    </div>
  );
};

export default StudentGrid;