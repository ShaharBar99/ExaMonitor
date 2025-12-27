import React from 'react';
import MessageManager from './MessageManager';
import NotificationManager from './NotificationManager';
import ExamBotPanel from './ExamBotPanel'; // הרכיב שהרגע עדכנו

export default function SidebarPanel({ activeTab, userRole }) {
  
  // 1. טאב התראות - משותף לכולם (עם סינון פנימי)
  if (activeTab === 'notifications') {
    return <NotificationManager userRole={userRole} />;
  }

  // 2. טאב בוט - זמין למשגיח חדר בלבד
  if (activeTab === 'bot' && userRole === 'supervisor') {
    return <ExamBotPanel />;
  }

  // 3. ניהול הודעות (צ'אט מרצה / צ'אט קומה) - לפי הרשאות רכיב MessageManager
  return <MessageManager activeTab={activeTab} userRole={userRole} />;
}