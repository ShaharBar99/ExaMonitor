import React from 'react';

const StudentCard = ({ student, onStatusChange }) => {
  const isOut = student.status === 'שירותים';
  const isFinished = student.status === 'סיים';

  return (
    <div className={`relative bg-white rounded-4xl p-6 shadow-sm border-2 transition-all duration-300
      ${isOut ? 'border-amber-400 ring-4 ring-amber-50' : 'border-transparent'} 
      ${isFinished ? 'opacity-40 grayscale' : ''}`}>
      
      {/* תגיות עליונות */}
      <div className="flex justify-between items-center mb-8">
        <div className={`px-4 py-1.5 rounded-full text-[11px] font-black tracking-tight ${
          isOut ? 'bg-amber-100 text-amber-600' : 
          isFinished ? 'bg-slate-100 text-slate-400' : 
          'bg-emerald-100 text-emerald-600'
        }`}>
          {student.status}
        </div>
      </div>

      {/* פרטי סטודנט */}
      <div className="text-center mb-10">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{student.name}</h3>
        <p className="text-xs text-slate-300 font-bold mt-1 uppercase">ID: {student.id}</p>
      </div>

      {/* כפתורי פעולה - הפוכים לפי התמונה */}
      <div className="flex gap-4">
        {/* כפתור סטטוס (ירוק/צהוב) בצד ימין (RTL - מופיע בשמאל ויזואלית) */}
        <button 
          onClick={() => onStatusChange(student.id, isOut ? 'במבחן' : 'שירותים')}
          disabled={isFinished}
          className={`flex-[1.5] py-4 rounded-2xl text-sm font-black text-white transition-all active:scale-95 shadow-lg ${
            isOut 
            ? 'bg-[#059669] shadow-emerald-100' 
            : 'bg-[#eab308] shadow-amber-100'
          }`}
        >
          {isOut ? 'חזר לחדר' : 'יצא לשירותים'}
        </button>

        {/* כפתור הגשה בצד שמאל (RTL - מופיע בימין ויזואלית) */}
        <button 
          onClick={() => onStatusChange(student.id, 'סיים')}
          disabled={isFinished}
          className="flex-1 bg-[#f1f5f9] text-slate-400 py-4 rounded-2xl text-sm font-black hover:bg-slate-200 transition-colors active:scale-95"
        >
          הגשה
        </button>
      </div>
    </div>
  );
};

export default StudentCard;