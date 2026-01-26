import React from 'react';

export default function RoomCard({ room, examData, supervisors, onSupervisorChange, readOnly, isDark }) {
  const statusTheme = {
    active: { 
      dot: 'bg-emerald-500', 
      border: isDark ? 'border-slate-800' : 'border-slate-50', 
      text: 'text-emerald-500' 
    },
    warning: { 
      dot: 'bg-rose-500 animate-pulse', 
      border: isDark ? 'border-rose-500/30' : 'border-rose-200 shadow-rose-50', 
      text: 'text-rose-500' 
    },
    completed: { 
      dot: 'bg-slate-500', 
      border: isDark ? 'border-slate-800' : 'border-slate-100', 
      text: 'text-slate-400' 
    }
  };
  
  const currentTheme = statusTheme[room.status] || statusTheme.active;

  return (
    <div className={`rounded-[25px] md:rounded-[35px] p-5 md:p-8 border-2 transition-all flex flex-col h-full ${
      isDark 
        ? `bg-slate-900/40 ${currentTheme.border}` 
        : `bg-white border-slate-100 border-2 shadow-sm`
    }`}>
      
      {/* Upper section */}
      <div className="flex justify-between items-start mb-4 md:mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-xl md:text-2xl font-black tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              חדר {room.room_number}
            </h3>
            {room.status === 'warning' && <span className="text-lg md:text-xl">⚠️</span>}
          </div>
          <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {room.examName}
          </p>

        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 md:py-1.5 rounded-full border transition-colors ${
          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${currentTheme.dot}`}></span>
          <span className={`text-[8px] md:text-[11px] font-black uppercase tracking-tight ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {room.status === 'warning' ? 'חריג' : 'בזמן אמת'}
          </span>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-6 md:mb-8">
        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border transition-colors ${
          isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50/50 border-slate-100'
        }`}>
          <p className={`text-[8px] md:text-[11px] font-black uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>נבחנים</p>
          <p className={`text-lg md:text-xl font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{room.studentsCount || 0}</p>
        </div>
        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border transition-colors ${
          isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/30 border-emerald-100/50'
        }`}>
          <p className={`text-[8px] md:text-[11px] font-black uppercase mb-1 ${isDark ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>הגישו</p>
          <p className={`text-lg md:text-xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{room.submittedCount || 0}</p>
        </div>



        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border transition-colors ${
          isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50/50 border-slate-100'
        }`}>
          <p className={`text-[8px] md:text-[11px] font-black uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            הארכת זמן
          </p>
          <p className={`text-lg md:text-xl font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {Number(examData?.extra_time || 0)} דק׳
          </p>
        </div>





      </div>

      {/* Supervisor Selection */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-2 px-1">
            <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-tighter ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>צוות השגחה</p>
            {readOnly && <span className="text-[8px] md:text-[9px] font-bold text-slate-500 italic">צפייה בלבד</span>}
        </div>
        
        <div className="relative">
          {readOnly ? (
            <div className={`flex items-center gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl border ${
              isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-base border ${
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'
              }`}>
                👤
              </div>
              <div className="overflow-hidden">
                <p className={`text-xs md:text-sm font-black truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {room.supervisor || 'טרם שובץ'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <select 
                value={room.supervisor_id || ''}
                onChange={(e) => onSupervisorChange(room.id, e.target.value)}
                className={`w-full border-2 border-transparent rounded-xl md:rounded-2xl py-3 md:py-4 px-4 font-bold text-xs md:text-sm outline-none appearance-none cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-indigo-500/10 text-indigo-300 focus:border-indigo-500/50' 
                    : 'bg-indigo-50/50 text-indigo-900 focus:border-indigo-200'
                }`}
              >
                <option value="" disabled className={isDark ? 'bg-slate-900' : ''}>שבץ משגיח...</option>
                {supervisors.map(sup => (
                  <option key={sup.id} value={sup.id} className={isDark ? 'bg-slate-900' : ''}>{sup.name}</option>
                ))}
              </select>
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-black ${
                isDark ? 'text-indigo-400/50' : 'text-indigo-400'
              }`}>
                ⇅
              </div>
            </>
          )}
        </div>
      </div>

      {room.status === 'warning' && (
        <div className={`mt-4 p-3 md:p-4 rounded-xl shadow-lg flex items-center gap-3 animate-bounce cursor-pointer ${
          isDark ? 'bg-rose-500 shadow-rose-900/20' : 'bg-rose-600 shadow-rose-100'
        }`}>
          <span className="text-white font-black text-[10px] md:text-xs uppercase tracking-widest flex-1 text-center">
            לצפייה בדיווח חריג
          </span>
        </div>
      )}
    </div>
  );
}