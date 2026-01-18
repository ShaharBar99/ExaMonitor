import React from 'react';

export default function LogsTab({ incidents }) {
    incidents = incidents || [];

    // מיפוי אירועים לפורמט תצוגה אחיד
    const allLogs = incidents.map(inc => ({
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
    <div className="bg-white rounded-[50px] p-12 shadow-2xl overflow-hidden text-right animate-in fade-in duration-500">
      <h2 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tight">יומן אירועים קומתי</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
              <th className="py-4 px-4 font-black">שעה</th>
              <th className="py-4 px-4 font-black">חדר</th>
              <th className="py-4 px-4 font-black">סטודנט</th>
              <th className="py-4 px-4 font-black">סוג אירוע</th>
              <th className="py-4 px-4 font-black">תיאור</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {allLogs.length > 0 ? allLogs.map((log) => (
              <tr key={log.id} className={`group hover:bg-slate-50 transition-colors ${log.severity === 'high' || log.severity === 'critical' ? 'bg-red-50/30' : ''}`}>
                <td className="py-4 px-4 text-slate-500 font-mono text-sm font-bold">{log.time}</td>
                <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase">{log.room}</span>
                </td>
                <td className="py-4 px-4">
                    {log.studentId ? (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{log.studentId}</span>
                    ) : '-'}
                </td>
                <td className="py-4 px-4">
                    <span className={`text-sm font-bold ${log.severity === 'high' || log.severity === 'critical' ? 'text-rose-600' : 'text-slate-700'}`}>
                        {log.type}
                    </span>
                </td>
                <td className="py-4 px-4 text-slate-600 text-sm">{log.description}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400 font-bold uppercase">אין אירועים רשומים כעת</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}