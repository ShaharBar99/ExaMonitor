import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // כדי לקבל את ה-examId מהכתובת
import { notificationHandlers } from '../../handlers/notificationHandlers';

export default function NotificationManager({ userRole }) {
  // 1. הגדרת State לנתונים ולמצב טעינה
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { examId } = useParams(); // מניח שהנתיב שלך כולל :examId

  // 2. שימוש ב-Effect כדי למשוך נתונים ברגע שהקומפוננטה עולה
  useEffect(() => {
    // קריאה ל-Handler שמפעיל את ה-API
    notificationHandlers.loadNotifications(examId, setNotifications, setIsLoading);
  }, [examId]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">
          יומן אירועים - {userRole === 'supervisor' ? 'משגיח כיתה' : 'מנהל קומה'}
        </h4>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* 3. הצגת מצב טעינה */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-xl border border-slate-100" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase italic">
            אין התראות חדשות
          </div>
        ) : (
          /* 4. רינדור הנתונים שהגיעו מה-Handler */
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`p-4 border-r-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:scale-[1.02] ${
                n.type === 'warning' || n.type === 'urgent' 
                  ? 'border-r-amber-500 bg-amber-50/20' 
                  : 'border-r-blue-500 bg-blue-50/20'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-slate-800">
                  {/* התאמת השדות למבנה הנתונים מה-API */}
                  {n.title || (n.type === 'warning' ? 'אזהרת מערכת' : 'עדכון')}
                </span>
                <span className="text-[9px] font-bold text-slate-400 font-mono">{n.time}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {n.message || n.desc}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}