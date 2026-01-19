import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../state/ThemeContext'; // ייבוא ה-Theme

export default function ChatInterface({ title, messages = [], onSendMessage, accentColor = "blue" }) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const { isDark } = useTheme();

  // גלילה אוטומטית לתחתית
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    onSendMessage(inputText);
    setInputText(''); 
  };

  // מיפוי צבעים למצבי בהיר/כהה
  const colors = {
    blue: isDark ? 'bg-blue-500' : 'bg-blue-600',
    indigo: isDark ? 'bg-indigo-500' : 'bg-indigo-600',
    rose: isDark ? 'bg-rose-500' : 'bg-rose-600'
  };

  return (
    <div className={`flex flex-col h-full transition-colors ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between transition-colors ${
        isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
      }`}>
        <h3 className={`font-black italic uppercase text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          {title}
        </h3>
        <div className={`w-2 h-2 rounded-full ${colors[accentColor] || colors.blue} animate-pulse`}></div>
      </div>

      {/* אזור ההודעות */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors ${
        isDark ? 'bg-slate-950/50' : 'bg-slate-50/50'
      }`}>
        {(messages || []).map((msg, index) => (
          <div 
            key={msg.id || `msg-${index}-${Math.random()}`} 
            className={`flex flex-col ${msg.isMe ? 'items-start' : 'items-end'}`}
          >
            {!msg.isMe && (
              <span className={`text-[10px] font-bold mb-1 px-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                {msg.senderName}
              </span>
            )}
            
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-bold shadow-sm transition-all ${
              msg.isMe 
                ? `${colors[accentColor] || colors.blue} text-white rounded-tl-none` 
                : isDark 
                  ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tr-none'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tr-none'
            }`}>
              {msg.text}
            </div>
            
            <span className={`text-[9px] font-black mt-1 px-1 uppercase tabular-nums ${
              isDark ? 'text-slate-600' : 'text-slate-400'
            }`}>
              {msg.timestamp}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* שדה הקלט */}
      <form onSubmit={handleSend} className={`p-4 border-t transition-colors ${
        isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
      }`}>
        <div className="relative flex items-center">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="הקלד הודעה..."
            className={`w-full border-none rounded-2xl py-4 pr-12 pl-4 text-sm font-bold transition-all text-right outline-none focus:ring-2 ${
              isDark 
                ? 'bg-slate-800 text-white placeholder:text-slate-500 focus:ring-slate-700' 
                : 'bg-slate-50 text-black placeholder:text-slate-400 focus:ring-slate-100'
            }`}
            dir="rtl"
          />
          <button 
            type="submit"
            className={`absolute right-2 p-2 rounded-xl text-white transition-all active:scale-90 shadow-md ${
              colors[accentColor] || colors.blue
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}