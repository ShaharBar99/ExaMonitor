import React from 'react';

export default function LogsTab({ incidents, isDark , islecturer = false }) {
    incidents = incidents || [];

    // for the lecturer show only critical incidents
    const source = islecturer
        ? incidents.filter(inc => inc.severity === 'high' || inc.severity === 'critical')
        : incidents;

    // מיפוי אירועים לפורמט תצוגה אחיד
    const allLogs = source.map(inc => ({
      id: inc.id,
      time: inc.created_at ? new Date(inc.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '--:--',
      room: inc.room_number || 'כללי',
      severity: inc.severity,
      type: inc.incident_type,
      description: inc.description || '',
      studentId: inc.student_id_str,
      timestamp: inc.created_at ? new Date(inc.created_at).getTime() : 0
    })).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className={`rounded-[30px] md:rounded-[50px] p-6 md:p-12 shadow-2xl overflow-hidden text-right animate-in fade-in duration-500 transition-colors ${
        isDark ? 'bg-slate-900 shadow-none border border-slate-800' : 'bg-white shadow-2xl shadow-slate-200/50'
    }`}>
      <h2 className={`text-xl md:text-2xl font-black mb-6 md:mb-8 uppercase tracking-tight ${
          isDark ? 'text-white' : 'text-slate-800'
      }`}>
        {islecturer ? 'אירועים חריגים' : 'יומן אירועים קומתי'}
      </h2>
      
      {/* Table for Tablet/Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className={`border-b text-[10px] md:text-xs uppercase tracking-wider transition-colors ${
                isDark ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'
            }`}>
              <th className="py-4 px-4 font-black">שעה</th>
              <th className="py-4 px-4 font-black">חדר</th>
              <th className="py-4 px-4 font-black">סטודנט</th>
              <th className="py-4 px-4 font-black">סוג אירוע</th>
              <th className="py-4 px-4 font-black">תיאור</th>
            </tr>
          </thead>
          <tbody className={`divide-y transition-colors ${isDark ? 'divide-slate-800' : 'divide-slate-50'}`}>
            {allLogs.length > 0 ? allLogs.map((log) => {
              const isCritical = log.severity === 'high' || log.severity === 'critical';
              
              return (
                <tr key={log.id} className={`group transition-colors ${
                    isCritical 
                        ? (isDark ? 'bg-rose-500/10 hover:bg-rose-500/20' : 'bg-red-50/50 hover:bg-red-50') 
                        : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')
                }`}>
                  <td className={`py-4 px-4 font-mono text-sm font-bold ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {log.time}
                  </td>
                  <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase transition-colors ${
                          isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {log.room}
                      </span>
                  </td>
                  <td className="py-4 px-4">
                      {log.studentId ? (
                          <span className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {log.studentId}
                          </span>
                      ) : '-'}
                  </td>
                  <td className="py-4 px-4">
                      <span className={`text-sm font-bold transition-colors ${
                          isCritical ? 'text-rose-500' : isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                          {log.type}
                      </span>
                  </td>
                  <td className={`py-4 px-4 text-sm transition-colors ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {log.description}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="5" className={`py-8 text-center font-bold uppercase ${
                    isDark ? 'text-slate-600' : 'text-slate-400'
                }`}>
                    אין אירועים רשומים כעת
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Stacked Cards for Mobile */}
      <div className="md:hidden space-y-4">
        {allLogs.length > 0 ? allLogs.map((log) => {
            const isCritical = log.severity === 'high' || log.severity === 'critical';
            return (
                <div key={log.id} className={`p-5 rounded-2xl border transition-all ${
                    isCritical 
                    ? (isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100')
                    : (isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100')
                }`}>
                    <div className="flex justify-between items-start mb-3">
                        <span className={`text-xs font-mono font-black ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {log.time}
                        </span>
                        <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                חדר {log.room}
                            </span>
                            {log.studentId && (
                                <span className={`px-2 py-1 rounded text-[9px] font-black ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-600 shadow-sm'}`}>
                                    {log.studentId}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={`text-sm font-black mb-1 ${isCritical ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-800'}`}>
                        {log.type}
                    </div>
                    <div className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {log.description}
                    </div>
                </div>
            );
        }) : (
            <div className={`py-12 text-center text-xs font-black uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                אין אירועים רשומים כעת
            </div>
        )}
      </div>
    </div>
  );
}