import React, { useState, useRef, useEffect } from 'react';

export default function ChatInterface({ title, messages = [], onSendMessage, accentColor = "blue" }) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // גלילה אוטומטית לתחתית כשיש הודעה חדשה
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

  const colors = {
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
    rose: 'bg-rose-600'
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-black text-slate-800 italic uppercase text-sm">{title}</h3>
        <div className={`w-2 h-2 rounded-full ${colors[accentColor] || colors.blue} animate-pulse`}></div>
      </div>

      {/* אזור ההודעות - כאן התיקון המרכזי */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {/* הגנה מפני undefined בעזרת || [] */}
        {(messages || []).map((msg, index) => (
          <div 
            key={msg.id || `msg-${index}-${Math.random()}`} 
            className={`flex flex-col ${msg.isMe ? 'items-start' : 'items-end'}`}
          >
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-bold shadow-sm ${
              msg.isMe 
                ? `${colors[accentColor] || colors.blue} text-white rounded-tl-none` 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tr-none'
            }`}>
              {msg.text}
            </div>
            <span className="text-[9px] text-slate-400 font-black mt-1 px-1 uppercase tabular-nums">
              {msg.timestamp}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* שדה הקלט */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
        <div className="relative flex items-center">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="הקלד הודעה..."
            className="w-full bg-slate-50 text-black border-none rounded-2xl py-4 pr-12 pl-4 text-sm font-bold focus:ring-2 focus:ring-slate-100 transition-all text-right"
            dir="rtl"
          />
          <button 
            type="submit"
            className={`absolute right-2 p-2 rounded-xl text-white transition-all active:scale-90 ${colors[accentColor] || colors.blue}`}
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