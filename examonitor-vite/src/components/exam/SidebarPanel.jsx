import React from 'react';
import MessageManager from './MessageManager';
import NotificationManager from './NotificationManager';
import ExamBotPanel from '../supervisor/ExamBotPanel'; 
import { useTheme } from '../state/ThemeContext'; // ייבוא ה-Theme

export default function SidebarPanel({ activeTab, userRole, externalMessage, liveStats = null, onAction }) {
  const { isDark } = useTheme();

  // פונקציה עוטפת שתשמור על רקע אחיד לכל הרכיבים בתוך הסיידבר
  const renderContent = () => {
    // 1. טאב התראות
    if (activeTab === 'notifications') {
      return <NotificationManager userRole={userRole} />;
    }

    // 2. טאב בוט - זמין למשגיח חדר בלבד
    if (activeTab === 'bot' && userRole === 'supervisor') {
      return (
        <ExamBotPanel 
          userRole={userRole} 
          externalMessage={externalMessage} 
          onAction={onAction} 
          liveStats={liveStats}
        />
      );
    }

    // 3. ניהול הודעות (צ'אט מרצה / צ'אט קומה)
    return <MessageManager activeTab={activeTab} userRole={userRole} />;
  };

  return (
    <div className={`h-full w-full transition-colors duration-300 ${
      isDark ? 'bg-slate-900 border-r border-slate-800' : 'bg-white border-r border-slate-100'
    }`}>
      {renderContent()}
    </div>
  );
}