import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatInterface from './ChatInterface'; // וודא שהנתיב לקומפוננטת ה-UI נכון
import { messageHandlers } from '../../handlers/messageHandlers'; 
export default function MessageManager({ activeTab, userRole }) {
  const { examId } = useParams();
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);

  // הגדרת המיפוי לפי המודל שביקשת
  const roleConfig = {
    // משגיח כיתה
    supervisor: {
      chat: { type: 'supervisor_to_floor', title: "קשר למשגיח קומה", color: "blue" }
    },
    // משגיח קומה
    floor_manager: {
      chat: { type: 'floor_to_supervisor', title: "הודעות לצוות המשגיחים", color: "blue" },
      lecturer: { type: 'floor_to_lecturer', title: "קשר ישיר למרצה", color: "indigo" }
    },
    // מרצה
    lecturer: {
      floor_chat: { type: 'lecturer_to_floor', title: "קשר למשגיח קומה", color: "rose" }
    }
  };

  const currentChat = roleConfig[userRole]?.[activeTab];

  useEffect(() => {
    let isMounted = true;
    if (!currentChat) return;

    const load = async () => {
      setLoading(true);
      try {
        // קריאה ל-Handler עם ה-Type המדויק
        await messageHandlers.initChat(examId, currentChat.type, (data) => {
          if (isMounted) setMessages(prev => ({ ...prev, [currentChat.type]: data }));
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [examId, currentChat?.type]);

  const onSend = async (text) => {
    const updater = (data) => setMessages(prev => ({ ...prev, [currentChat.type]: data }));
    await messageHandlers.handleSend(text, userRole, updater);
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-slate-400 font-bold">טוען צ'אט...</div>;
  if (!currentChat) return null;

  return (
    <ChatInterface 
      key={currentChat.type}
      title={currentChat.title}
      accentColor={currentChat.color}
      messages={messages[currentChat.type] || []}
      onSendMessage={onSend}
    />
  );
}