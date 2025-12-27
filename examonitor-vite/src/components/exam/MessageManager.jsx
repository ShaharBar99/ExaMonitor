import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatInterface from './ChatInterface';
import { messageHandlers } from '../../handlers/messageHandlers';

export default function MessageManager({ activeTab, userRole }) {
  const { examId } = useParams();
  
  // 1. אתחול ה-State כאובייקט עם מערכים ריקים למניעת undefined
  const [messages, setMessages] = useState({
    supervisor_to_floor: [],
    floor_to_supervisor: [],
    floor_to_lecturer: [],
    lecturer_to_floor: []
  });
  
  const [loading, setLoading] = useState(true);

  const roleConfig = {
    supervisor: {
      chat: { type: 'supervisor_to_floor', title: "קשר למשגיח קומה", color: "blue" }
    },
    floor_manager: {
      chat: { type: 'floor_to_supervisor', title: "הודעות לצוות המשגיחים", color: "blue" },
      lecturer: { type: 'floor_to_lecturer', title: "קשר ישיר למרצה", color: "indigo" }
    },
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
        await messageHandlers.initChat(examId, currentChat.type, (data) => {
          if (isMounted) {
            // 2. תיקון קריטי: מוודאים ש-data הוא מערך ומשלבים אותו בתוך האובייקט הקיים
            const validatedData = Array.isArray(data) ? data : [];
            setMessages(prev => ({
              ...prev,
              [currentChat.type]: validatedData
            }));
          }
        });
      } catch (error) {
        console.error("Error loading chat:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [examId, currentChat?.type]);

  const onSend = async (text) => {
    if (!currentChat) return;
    
    // פונקציית עדכון ששומרת על מבנה האובייקט
    const updater = (newData) => {
      setMessages(prev => ({
        ...prev,
        [currentChat.type]: typeof newData === 'function' ? newData(prev[currentChat.type]) : newData
      }));
    };

    await messageHandlers.handleSend(text, userRole, updater);
  };

  // 3. הגנה לפני רינדור
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">טוען הודעות...</p>
        </div>
      </div>
    );
  }

  if (!currentChat) return null;

  // 4. שליחת המערך הספציפי עם "רשת ביטחון" של מערך ריק
  const currentMessages = messages[currentChat.type] || [];

  return (
    <ChatInterface 
      key={currentChat.type}
      title={currentChat.title}
      accentColor={currentChat.color}
      messages={currentMessages}
      onSendMessage={onSend}
    />
  );
}