import React, { useRef, useEffect, useState } from 'react';

export default function ChatInterface({ 
  messages, 
  onSendMessage, 
  title, 
  placeholder, 
  accentColor = "indigo", // indigo, blue, rose, etc.
  icon = "💬"
}) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue("");
  };

  // מפת צבעים לפי ה-Prop שמתקבל
  const colors = {
    indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', shadow: 'shadow-indigo-100', border: 'focus-within:border-indigo-200' },
    blue:   { bg: 'bg-blue-600',   text: 'text-blue-600',   shadow: 'shadow-blue-100',   border: 'focus-within:border-blue-200' },
    rose:   { bg: 'bg-rose-600',   text: 'text-rose-600',   shadow: 'shadow-rose-100',   border: 'focus-within:border-rose-200' },
  };

  const style = colors[accentColor] || colors.indigo;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]/50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg bg-slate-50`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 leading-tight">{title}</h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ערוץ פעיל</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-start' : 'items-end'}`}>
            <span className="text-[9px] font-black text-slate-400 mb-1 px-2 uppercase tracking-tighter">
              {msg.isMe ? 'אני' : msg.sender}
            </span>
            <div className={`max-w-[85%] px-4 py-3 rounded-[22px] shadow-sm text-sm font-bold leading-relaxed ${
              msg.isMe 
                ? `${style.bg} text-white rounded-tr-none ${style.shadow}` 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-slate-50'
            }`}>
              {msg.text}
              <div className={`text-[8px] mt-1 opacity-60 font-black ${msg.isMe ? 'text-left' : 'text-right'}`}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className={`flex gap-2 bg-slate-50 p-2 rounded-2xl border-2 border-transparent transition-all ${style.border} focus-within:bg-white`}>
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none px-3 text-sm font-bold text-slate-700 placeholder:text-slate-300"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim()}
            className={`${style.bg} text-white p-2.5 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-30`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}