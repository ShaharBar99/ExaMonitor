import React from 'react';

export default function NotificationManager({ userRole }) {
  const notifications = [
    { id: 1, type: 'warning', title: 'קריאת עזרה', desc: 'חדר 302', time: '12:00' },
    { id: 2, type: 'info', title: 'הודעת מרצה', desc: 'הבהרה חדשה', time: '11:50' },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">יומן אירועים - {userRole}</h4>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.map(n => (
          <div key={n.id} className={`p-4 border-r-4 rounded-xl border border-slate-100 shadow-sm ${
            n.type === 'warning' ? 'border-r-amber-500 bg-amber-50/20' : 'border-r-blue-500 bg-blue-50/20'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-slate-800">{n.title}</span>
              <span className="text-[9px] font-bold text-slate-400">{n.time}</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">{n.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}