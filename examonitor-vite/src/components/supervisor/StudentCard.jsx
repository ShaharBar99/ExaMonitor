import React from 'react';
import { useTheme } from '../state/ThemeContext';

const StudentCard = ({ student, onStatusChange, onMoveClass }) => {
  const { isDark } = useTheme();
  const isOut = student.status === 'exited_temporarily';
  const isFinished = student.status === 'submitted' || student.status === 'finished';
  const personalExtra = student.personalExtra || 0;

  const getStatusConfig = () => {
    if (isFinished) {
      return isDark 
        ? { bg: 'bg-slate-800', text: 'text-slate-400', label: 'הגיש מבחן', dot: 'bg-slate-500' }
        : { bg: 'bg-slate-100', text: 'text-slate-500', label: 'הגיש מבחן', dot: 'bg-slate-400' };
    }
    if (isOut) {
      return isDark
        ? { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'יצא מהחדר', dot: 'bg-amber-500' }
        : { bg: 'bg-amber-100', text: 'text-amber-700', label: 'יצא מהחדר', dot: 'bg-amber-500' };
    }
    return isDark
      ? { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'במבחן פעיל', dot: 'bg-emerald-500' }
      : { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'במבחן פעיל', dot: 'bg-emerald-500' };
  };

  const config = getStatusConfig();

  return (
    <div className={`group relative rounded-[40px] p-10 border-4 transition-all duration-300 text-right
      ${isDark ? 'bg-slate-900' : 'bg-white'}
      ${isOut 
        ? (isDark ? 'border-amber-500/30 shadow-2xl shadow-amber-900/20' : 'border-amber-300 shadow-2xl shadow-amber-500/10') 
        : (isDark ? 'border-slate-800 hover:border-emerald-500/30 hover:shadow-emerald-900/20' : 'border-slate-50 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-slate-300/50')
      } 
      ${isFinished ? 'opacity-60 grayscale-[0.3]' : ''}`} dir="rtl">
      
      {/* סטטוס עליון */}
      <div className="flex justify-between items-center mb-8">
        <div className={`flex items-center gap-3 px-6 py-2 rounded-full ${config.bg} ${config.text} border-2 border-current/5`}>
          <span className={`w-3 h-3 rounded-full ${config.dot} ${!isFinished && 'animate-pulse'}`}></span>
          <span className="text-sm font-black uppercase tracking-wider">{config.label}</span>
        </div>
      </div>

      {/* פרטי הסטודנט */}
      <div className="mb-10">
        <h3 className={`text-4xl font-black tracking-tighter leading-tight group-hover:text-emerald-500 transition-colors ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          {student.name}
        </h3>
        <p className={`text-lg font-black mt-3 uppercase tracking-widest ${
          isDark ? 'text-slate-500' : 'text-slate-400'
        }`}>
          ת.ז • {student.studentId ? student.studentId : student.student_id}
        </p>
        
        {/* תג הארכה אישית */}
        {personalExtra > 0 && (
          <div className={`mt-4 px-4 py-2 rounded-xl items-center gap-2 shadow-lg inline-flex ${
            isDark ? 'bg-purple-900/50 text-purple-300 shadow-none' : 'bg-purple-600 text-white shadow-purple-200'
          }`}>
            <span className="text-lg">⏱️</span>
            <span className="font-black text-sm">+{personalExtra}% זמן</span>
          </div>
        )}
      </div>

      {/* אזור פעולות */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <button 
            onClick={() => onStatusChange(student.id, isOut ? 'במבחן' : 'שירותים')}
            disabled={isFinished}
            className={`flex-2 py-6 rounded-[25px] text-xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg
              ${isOut 
                ? 'bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600' 
                : 'bg-amber-500 text-white shadow-amber-200 hover:bg-amber-600'} 
              disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none
              ${isDark && 'shadow-none'}`}
          >
            {isOut ? 'חזר לחדר' : 'שירותים'}
          </button>

          <button 
            onClick={() => onStatusChange(student.id, 'סיים')}
            disabled={isFinished}
            className={`flex-1 py-6 rounded-[25px] text-lg font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
              isDark 
                ? 'bg-slate-800 text-white hover:bg-rose-600 shadow-none' 
                : 'bg-slate-900 text-white hover:bg-rose-600'
            }`}
          >
            הגשה
          </button>
        </div>

        {!isFinished && (
          <button 
            onClick={() => onMoveClass && onMoveClass(student.id)}
            className={`w-full py-5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest border-2 ${
              isDark 
                ? 'bg-slate-800/50 text-slate-500 border-transparent hover:bg-indigo-900/30 hover:text-indigo-400 hover:border-indigo-500/20' 
                : 'bg-slate-50 text-slate-400 border-transparent hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100'
            }`}
          >
            <span className="text-xl">🔄</span> העברת כיתה
          </button>
        )}
      </div>

      {/* פס התקדמות תחתון */}
      {!isFinished && (
          <div className={`absolute bottom-0 left-12 right-12 h-2 rounded-full overflow-hidden ${
            isDark ? 'bg-slate-800' : 'bg-slate-100'
          }`}>
            <div className={`h-full transition-all duration-1000 ${isOut ? 'bg-amber-500 w-full' : 'bg-emerald-500 w-1/3'}`}></div>
          </div>
      )}
    </div>
  );
};

export default StudentCard;