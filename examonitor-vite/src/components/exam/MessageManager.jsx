import React, { useState } from 'react';
import ChatInterface from './ChatInterface';

export default function MessageManager({ activeTab, userRole }) {
  const [messages, setMessages] = useState({
    floor: [{ id: 1, text: "נא לאסוף מחברות בחדר 302", sender: "מנהל", isMe: false, time: "11:00" }],
    lecturer: [{ id: 1, text: "יש הבהרה לשאלה 4", sender: "מרצה", isMe: false, time: "11:05" }],
    team: [{ id: 1, text: "מישהו פנוי להחלפה?", sender: "משגיח 1", isMe: false, time: "11:10" }]
  });

  const handleSend = (type, text) => {
    const newMsg = { id: Date.now(), text, sender: "אני", isMe: true, time: "עכשיו" };
    setMessages(prev => ({ ...prev, [type]: [...prev[type], newMsg] }));
  };

  // לוגיקת ניתוב לפי תפקיד וטאב
  if (userRole === 'supervisor' && activeTab === 'chat') {
    return <ChatInterface title="קשר למשגיח קומה" accentColor="blue" messages={messages.floor} onSendMessage={(t) => handleSend('floor', t)} />;
  }

  if (userRole === 'floor_manager') {
    if (activeTab === 'chat') return <ChatInterface title="צ'אט צוות" accentColor="blue" messages={messages.team} onSendMessage={(t) => handleSend('team', t)} />;
    if (activeTab === 'lecturer') return <ChatInterface title="קשר למרצה" accentColor="indigo" messages={messages.lecturer} onSendMessage={(t) => handleSend('lecturer', t)} />;
  }

  if (userRole === 'lecturer' && activeTab === 'floor_chat') {
    return <ChatInterface title="קשר למשגיח קומה" accentColor="rose" messages={messages.floor} onSendMessage={(t) => handleSend('floor', t)} />;
  }

  return null;
}