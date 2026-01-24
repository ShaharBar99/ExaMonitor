import React from 'react';
import MessageManager from './MessageManager';
import ExamBotPanel from '../supervisor/ExamBotPanel'; 
import { useTheme } from '../state/ThemeContext'; 

export default function SidebarPanel({ activeTab, userRole, externalMessage, liveStats = null, onAction, userName }) {
  const { isDark } = useTheme();

  const renderContent = () => {
    // 2. Bot Tab - Supervisor only
    if (activeTab === 'bot' && userRole === 'supervisor') {
      return (
        <ExamBotPanel 
          userRole={userRole} 
          externalMessage={externalMessage} 
          onAction={onAction} 
          liveStats={liveStats}
          userName={userName}
        />
      );
    }

    // 3. Message Management (Lecturer/Floor chat)
    return <MessageManager activeTab={activeTab} userRole={userRole} />;
  };

  return (
    <div className={`h-full w-full flex flex-col transition-colors duration-300 overflow-hidden ${
    isDark 
      ? 'bg-slate-900 shadow-[20px_0_50px_rgba(0,0,0,0.3)]' 
      : 'bg-white' 
      }`}>
      
      {/* Mobile-Specific Header */}
      <div className="md:hidden px-6 py-3 border-b border-slate-500/10 flex items-center justify-between shrink-0">
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Active Panel: {activeTab}
        </span>
      </div>

      {/* Main Content Area - התיקון כאן */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden"> 
        {/* שינוי קריטי: 
            1. הוספתי flex ו-flex-col כדי שה-renderContent ימלא את כל הגובה.
            2. שיניתי מ-overflow-y-auto ל-overflow-hidden כדי למנוע כפל גלילה וחיתוך.
            3. ה-ExamBotPanel כבר מכיל גלילה פנימית משלו.
        */}
        {renderContent()}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? '#334155' : '#e2e8f0'};
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}