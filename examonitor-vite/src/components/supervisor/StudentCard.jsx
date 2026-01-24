import React from 'react';
import { useTheme } from '../state/ThemeContext';

const StudentCard = ({ student, onStatusChange, onMoveClass }) => {
  const { isDark } = useTheme();
  const isOut = student.status === 'exited_temporarily';
  const isFinished = student.status === 'submitted' || student.status === 'finished';
  const personalExtra = student.personalExtra || 0;

  const config = (isFinished) 
    ? (isDark ? { bg: 'bg-slate-800', text: 'text-slate-400', label: 'הגיש', dot: 'bg-slate-500' } : { bg: 'bg-slate-100', text: 'text-slate-500', label: 'הגיש', dot: 'bg-slate-400' })
    : (isOut)
    ? (isDark ? { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'בחוץ', dot: 'bg-amber-500' } : { bg: 'bg-amber-100', text: 'text-amber-700', label: 'בחוץ', dot: 'bg-amber-500' })
    : (isDark ? { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'פעיל', dot: 'bg-emerald-500' } : { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'פעיל', dot: 'bg-emerald-500' });

  return (
    <div className={`group relative rounded-[20px] sm:rounded-[30px] p-3 sm:p-5 border-2 transition-all duration-300 text-right flex flex-col min-w-0 overflow-hidden
      ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}
      ${isOut && (isDark ? 'border-amber-500/40 shadow-lg' : 'border-amber-300 shadow-lg')}
      ${isFinished ? 'opacity-60' : ''}`} dir="rtl">
      
      {/* Status Badge - Ultra Small for SM screens */}
      <div className="flex justify-between items-center mb-2 sm:mb-4">
        <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 rounded-full ${config.bg} ${config.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${!isFinished && 'animate-pulse'}`}></span>
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-tighter truncate">{config.label}</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="mb-3 sm:mb-6 min-w-0">
        <h3 className={`text-sm sm:text-lg md:text-xl font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {student.name}
        </h3>
        <p className={`text-[9px] sm:text-xs font-bold mt-0.5 opacity-60 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
          ID • {student.studentId || student.student_id}
        </p>
        
        {personalExtra > 0 && (
          <div className={`mt-1.5 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 ${isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
            <span className="text-[9px] sm:text-xs font-black">+{personalExtra}% זמן</span>
          </div>
        )}
      </div>

      {/* Actions Section - Optimized for SM width */}
      <div className="space-y-1.5 sm:space-y-3 mt-auto">
        <div className="flex gap-1.5">
          <button 
            onClick={() => onStatusChange(student.id, isOut ? 'במבחן' : 'שירותים')}
            disabled={isFinished}
            className={`flex-[1.5] py-2 sm:py-4 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-black uppercase transition-all active:scale-95
              ${isOut ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'} 
              disabled:opacity-30 min-w-0 truncate`}
          >
            {isOut ? 'חזר' : 'שירותים'}
          </button>

          <button 
            onClick={() => onStatusChange(student.id, 'סיים')}
            disabled={isFinished}
            className={`flex-1 py-2 sm:py-4 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-black uppercase transition-all ${
              isDark ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'
            }`}
          >הגשה
          </button>
        </div>

        {!isFinished && (
          <button 
            onClick={() => onMoveClass && onMoveClass(student.id)}
            className={`w-full py-1.5 sm:py-2.5 rounded-lg text-[8px] sm:text-[10px] font-bold transition-all border-2 border-transparent hover:bg-indigo-50/10 ${
              isDark ? 'text-slate-500' : 'text-slate-400 bg-slate-50'
            }`}
          >
            🔄 העברה
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentCard;