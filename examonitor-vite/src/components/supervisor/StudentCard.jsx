import React from 'react';

const StudentCard = ({ student, onStatusChange, onMoveClass }) => {
  const isOut = student.status === 'exited_temporarily';
  const isFinished = student.status === 'submitted';

  // לוגיקת עיצוב לפי סטטוס
  const getStatusConfig = () => {
    if (isFinished) return { bg: 'bg-slate-100', text: 'text-slate-400', label: 'הגיש מבחן', dot: 'bg-slate-300' };
    if (isOut) return { bg: 'bg-amber-50', text: 'text-amber-600', label: 'יצא מהחדר', dot: 'bg-amber-500' };
    return { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'במבחן פעיל', dot: 'bg-emerald-500' };
  };

  const config = getStatusConfig();

  return (
    <div className={`group relative bg-white rounded-4xl p-7 border-2 transition-all duration-300 text-right
      ${isOut ? 'border-amber-200 shadow-xl shadow-amber-500/5' : 'border-slate-50 hover:border-emerald-500/20 hover:shadow-2xl hover:shadow-slate-200/50'} 
      ${isFinished ? 'opacity-50 grayscale-[0.5]' : ''}`} dir="rtl">
      
      {/* שורה עליונה: סטטוס ומספר שולחן */}
      <div className="flex justify-between items-center mb-6">
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${config.bg} ${config.text} border border-current/10`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${!isFinished && 'animate-pulse'}`}></span>
          <span className="text-[10px] font-black uppercase tracking-tight">{config.label}</span>
        </div>
      </div>

      {/* פרטי הסטודנט */}
      <div className="mb-8">
        <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none group-hover:text-emerald-600 transition-colors">
          {student.name}
        </h3>
        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">ת.ז • {student.studentId}</p>
      </div>

      {/* אזור פעולות */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {/* פעולה מרכזית: יציאה/חזרה */}
          <button 
            onClick={() => onStatusChange(student.id, isOut ? 'במבחן' : 'שירותים')}
            disabled={isFinished}
            className={`flex-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm
              ${isOut 
                ? 'bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600' 
                : 'bg-amber-500 text-white shadow-amber-200 hover:bg-amber-600'} 
              disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none`}
          >
            {isOut ? 'חזר לחדר' : 'יצא לשירותים'}
          </button>

          {/* כפתור הגשה */}
          <button 
            onClick={() => onStatusChange(student.id, 'סיים')}
            disabled={isFinished}
            className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-colors active:scale-95 shadow-lg shadow-slate-200"
          >
            הגשה
          </button>
        </div>

        {/* העברת כיתה */}
        {!isFinished && (
          <button 
            onClick={() => onMoveClass && onMoveClass(student.id)}
            className="w-full py-3 bg-slate-50 rounded-xl text-[9px] font-black text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            <span>🔄</span> העברה לכיתה אחרת
          </button>
        )}
      </div>

      {/* פס התקדמות דקורטיבי בתחתית הכרטיס */}
      {!isFinished && (
         <div className="absolute bottom-0 left-8 right-8 h-1 bg-slate-50 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${isOut ? 'bg-amber-500 w-full' : 'bg-emerald-500 w-1/3'}`}></div>
         </div>
      )}
    </div>
  );
};

export default StudentCard;