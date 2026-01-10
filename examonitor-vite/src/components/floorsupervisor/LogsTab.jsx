import React from 'react';

export default function LogsTab({ notifications }) {
    notifications = notifications || [];
  return (
    <div className="bg-white rounded-[50px] p-12 shadow-2xl overflow-hidden text-right animate-in fade-in duration-500">
      <h2 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tight">יומן אירועים קומתי</h2>
      <div className="divide-y divide-slate-100">
        {notifications.length > 0 ? notifications.map(n => (
          <div key={n.id} className="py-4 flex justify-between items-center group hover:bg-slate-50 px-6 rounded-2xl transition-all">
            <div className="flex items-center gap-6 text-right">
              <span className="text-xs font-black text-slate-300 font-mono">{n.time}</span>
              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase">{n.room}</span>
              <p className={`text-sm font-bold ${n.type === 'warning' ? 'text-rose-600' : 'text-slate-600'}`}>{n.message}</p>
            </div>
          </div>
        )) : (
          <p className="text-slate-400 font-bold p-8 text-center uppercase">אין אירועים רשומים כעת</p>
        )}
      </div>
    </div>
  );
}