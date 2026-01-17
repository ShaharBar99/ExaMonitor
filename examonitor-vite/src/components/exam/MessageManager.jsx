import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import ChatInterface from './ChatInterface';
import { useSocket } from '../state/SocketContext';
import { useAuth } from '../state/AuthContext';

export default function MessageManager({ activeTab, userRole }) {
  const socket = useSocket();
  const { user } = useAuth();
  
  // 1. אתחול ה-state מתוך ה-localStorage
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : {
      supervisor_floor_chat: [],
      floor_lecturer_chat: []
    };
  });
  
  const roleConfig = {
    supervisor: {
      chat: { type: 'supervisor_floor_chat', title: "קשר למשגיח קומה", color: "blue" }
    },
    floor_manager: {
      chat: { type: 'supervisor_floor_chat', title: "קשר למשגיחים", color: "blue" },
      lecturer: { type: 'floor_lecturer_chat', title: "קשר ישיר למרצה", color: "indigo" }
    },
    lecturer: {
      floor_chat: { type: 'floor_lecturer_chat', title: "קשר למשגיח קומה", color: "rose" }
    }
  };

  const currentChat = roleConfig[userRole]?.[activeTab];

  // 2. שמירת הודעות לזיכרון המקומי בכל שינוי
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!socket || !userRole) return;

    const myRooms = roleConfig[userRole] || {};
    Object.values(myRooms).forEach(chat => {
      socket.emit('join_room', chat.type);
    });

    const handleNewMessage = (incoming) => {
      if (incoming.room) {
        setMessages(prev => ({
          ...prev,
          [incoming.room]: [...(prev[incoming.room] || []), incoming]
        }));
      }
    };

    socket.on('new_message', handleNewMessage);
    
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, userRole]);

  const onSend = (text) => {
    if (!currentChat || !socket) return;
    
    const message = {
      id: Date.now(),
      text: text.trim(),
      sender: user.role, 
      isMe: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => ({
      ...prev,
      [currentChat.type]: [...(prev[currentChat.type] || []), message]
    }));

    socket.emit('send_message', { 
      room: currentChat.type, 
      message: { ...message, isMe: false } 
    });
  };

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