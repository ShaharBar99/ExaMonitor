import React from 'react';

export default function RoomCard({ room, supervisors, onSupervisorChange, readOnly }) {
  // סטטוסים וצבעים לעיצוב מהיר
  const statusTheme = {
    active: { dot: 'bg-emerald-500', bg: 'border-slate-50', text: 'text-emerald-600' },
    warning: { dot: 'bg-rose-500 animate-pulse', bg: 'border-rose-200 shadow-rose-50', text: 'text-rose-600' },
    completed: { dot: 'bg-slate-300', bg: 'border-slate-100', text: 'text-slate-400' }
  };

  const currentTheme = statusTheme[room.status] || statusTheme.active;

  return (
    <div className={`bg-white rounded-[35px] p-8 border-2 transition-all shadow-sm flex flex-col h-full ${currentTheme.bg}`}>
      
      {/* חלק עליון: זיהוי חדר וסטטוס */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black text-slate-800 tabular-nums">חדר {room.id}</h3>
            {room.status === 'warning' && <span className="text-xl">⚠️</span>}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            {room.examName}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
          <span className={`w-2 h-2 rounded-full ${currentTheme.dot}`}></span>
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">
            {room.status === 'warning' ? 'אירוע חריג' : 'בזמן אמת'}
          </span>
        </div>
      </div>

      {/* מדדי נוכחות - קריטי לשני התפקידים */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">נבחנים בחדר</p>
          <p className="text-xl font-black text-slate-800">{room.studentsCount}</p>
        </div>
        <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
          <p className="text-[9px] font-black text-emerald-600/60 uppercase mb-1 font-mono">הגישו</p>
          <p className="text-xl font-black text-emerald-600">{room.submittedCount || 0}</p>
        </div>
      </div>

      {/* ניהול צוות השגחה - ההבדל בין מרצה למנהל קומה */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">צוות השגחה פעיל</p>
            {readOnly && <span className="text-[9px] font-bold text-slate-300 italic">צפייה בלבד</span>}
        </div>
        
        <div className={`relative ${!readOnly ? 'group' : ''}`}>
          {readOnly ? (
            /* מבט מרצה: כרטיס סטטי עם פרטי המשגיח */
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg border border-slate-100">
                👤
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black text-slate-700 truncate">
                  {room.supervisor || 'טרם שובץ משגיח'}
                </p>
              </div>
            </div>
          ) : (
            /* מבט מנהל קומה: Dropdown לניהול ושיבוץ */
            <>
              <select 
                value={room.supervisor || ''}
                onChange={(e) => onSupervisorChange(room.id, e.target.value)}
                className="w-full bg-indigo-50/50 border-2 border-transparent focus:border-indigo-200 group-hover:bg-indigo-50 rounded-2xl py-4 px-4 font-bold text-sm text-indigo-900 outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="" disabled>שבץ משגיח לחדר...</option>
                {supervisors.map(sup => (
                  <option key={sup.id} value={sup.name}>{sup.name}</option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 text-[10px]">
                CHANGE ⇅
              </div>
            </>
          )}
        </div>
      </div>

      {/* חיווי חריגה למרצה/מנהל */}
      {room.status === 'warning' && (
        <div className="mt-4 p-4 bg-rose-600 rounded-2xl shadow-lg shadow-rose-100 flex items-center gap-3 animate-bounce cursor-pointer">
          <span className="text-white font-black text-xs uppercase tracking-widest flex-1 text-center">
            לצפייה בדיווח חריג
          </span>
        </div>
      )}
    </div>
  );
}