import React from 'react';
import NotificationItem from './Notifications';
import { notifications } from '../../mocks/notificationitemsMock';
const Notifications = () => {
  const [notificationsList, setNotificationsList] = React.useState(notifications);
  return (
    <div className="flex flex-col h-full bg-[#f8fafc]/30">
      {/* כותרת פנימית קטנה לארגון העין */}
      <div className="px-6 py-3 bg-white/50 border-b border-slate-100">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">יומן אירועים חי</span>
          <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black">
            {notificationsList.length} חדשות
          </span>
        </div>
      </div>

      {/* רשימת ההתראות */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {notificationsList.length > 0 ? (
          notificationsList.map((notif) => (
            <div>{notif.time}:{notif.message} {notif.icon}</div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <span className="text-4xl mb-2">🍃</span>
            <p className="text-xs font-bold text-slate-400">אין התראות חדשות</p>
          </div>
        )}
      </div>

      {/* כפתור ניקוי (אופציונלי) */}
      <div className="p-4 border-t border-slate-50">
        <button className="w-full py-3 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
        onClick={()=>setNotificationsList([])}>
          נקה את כל ההתראות
        </button>
      </div>
    </div>
  );
};

export default Notifications;