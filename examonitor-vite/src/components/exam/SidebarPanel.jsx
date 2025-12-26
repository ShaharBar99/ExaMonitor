import React from 'react';
import ExamBotPanel from './ExamBotPanel';
import ChatMessages from './ChatMessages'; // וודא שהנתיב נכון
import Notifications from './Notifications'; // וודא שהנתיב נכון

const SidebarPanel = ({ activeTab }) => {
  // פונקציית עזר להחזרת התוכן הרלוונטי
  const renderContent = () => {
    switch (activeTab) {
      case 'bot':
        return <ExamBotPanel />;
      case 'chat':
        return <ChatMessages />;
      case 'notifications':
        return <Notifications />;
      default:
        return <ExamBotPanel />;
    }
  };

  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-white">
      {renderContent()}
    </div>
  );
};

export default SidebarPanel;