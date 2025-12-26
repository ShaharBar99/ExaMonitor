import React from 'react';

const StudentCard = ({ student, onStatusChange, onMoveClass }) => {
  const isOut = student.status === 'שירותים';
  const isFinished = student.status === 'סיים';

  return (
    <div className={`relative bg-white rounded-[32px] p-6 shadow-sm border-2 transition-all duration-300
      ${isOut ? 'border-amber-400 ring-4 ring-amber-50' : 'border-transparent'} 
      ${isFinished ? 'opacity-40 grayscale' : 'hover:shadow-md'}`}>
      
      {/* תגיות סטטוס ומספר שולחן (בתוך הכרטיס) */}
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
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{student.name}</h3>
        <p className="text-xs text-slate-300 font-bold mt-1 uppercase">ID: {student.id}</p>
      </div>

      {/* כפתורי פעולה */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {/* כפתור יציאה/חזרה */}
          <button 
            onClick={() => onStatusChange(student.id, isOut ? 'במבחן' : 'שירותים')}
            disabled={isFinished}
            className={`flex-[1.5] py-4 rounded-2xl text-sm font-black text-white transition-all active:scale-95 shadow-lg ${
              isOut ? 'bg-[#059669] shadow-emerald-100' : 'bg-[#eab308] shadow-amber-100'
            }`}
          >
            {isOut ? 'חזר לחדר' : 'יצא לשירותים'}
          </button>

          {/* כפתור הגשה */}
          <button 
            onClick={() => onStatusChange(student.id, 'סיים')}
            disabled={isFinished}
            className="flex-1 bg-[#f1f5f9] text-slate-400 py-4 rounded-2xl text-sm font-black hover:bg-slate-200 transition-colors active:scale-95"
          >
            הגשה
          </button>
        </div>

        {/* כפתור העברת כיתה - בולט ונגיש */}
        {!isFinished && (
          <button 
            onClick={() => onMoveClass(student.id)}
            className="w-full py-3 border-2 border-slate-50 rounded-2xl text-[11px] font-black text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            העברה לכיתה אחרת
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentCard;