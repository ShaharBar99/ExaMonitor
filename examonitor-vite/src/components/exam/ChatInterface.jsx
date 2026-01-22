import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../state/ThemeContext';

export default function ChatInterface({ title, messages = [], onSendMessage, accentColor = "blue" }) {
  const [inputText, setInputText] = useState('');
  // Responsive base font size (smaller on mobile)
  const [fontSize, setFontSize] = useState(window.innerWidth < 640 ? 14 : 16); 
  const messagesEndRef = useRef(null);
  const { isDark } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, fontSize]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const increaseFont = () => setFontSize(prev => Math.min(prev + 2, 60));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 2, 10));

  const colors = {
    blue: isDark ? 'bg-blue-500' : 'bg-blue-600',
    indigo: isDark ? 'bg-indigo-500' : 'bg-indigo-600',
    rose: isDark ? 'bg-rose-500' : 'bg-rose-600'
  };

  return (
    <div className={`flex flex-col h-full transition-all duration-300 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      
      {/* Header - More compact on mobile */}
      <div className={`p-3 sm:p-4 border-b flex items-center justify-between transition-colors z-10 ${
        isDark ? 'border-slate-800 bg-slate-900 shadow-lg' : 'border-slate-100 bg-white shadow-sm'
      }`}>
        <div className="flex items-center gap-2">
          {/* Controls - Compact sizing */}
          <div className={`flex items-center border rounded-lg sm:rounded-xl overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <button 
              type="button"
              onClick={decreaseFont}
              className={`p-1.5 sm:p-2 transition-all active:scale-90 border-l ${
                isDark ? 'hover:bg-slate-800 border-slate-700 text-slate-400' : 'hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <span className="font-black text-[10px] sm:text-xs">A-</span>
            </button>
            <button 
              type="button"
              onClick={increaseFont}
              className={`p-1.5 sm:p-2 transition-all active:scale-90 ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span className="font-black text-xs sm:text-sm">A+</span>
            </button>
          </div>
          
          <h3 className={`font-black italic uppercase text-xs sm:text-sm mr-1 sm:mr-2 truncate max-w-30 sm:max-w-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {title}
          </h3>
        </div>
        <div className={`w-2 h-2 rounded-full ${colors[accentColor] || colors.blue} animate-pulse`}></div>
      </div>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 transition-colors ${
        isDark ? 'bg-slate-950/50' : 'bg-slate-50/50'
      }`}>
        {(messages || []).map((msg, index) => (
          <div 
            key={msg.id || `msg-${index}`} 
            className={`flex flex-col ${msg.isMe ? 'items-start' : 'items-end'}`}
          >
            {!msg.isMe && (
              <span className={`text-[9px] sm:text-[10px] font-bold mb-1 px-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                {msg.senderName}
              </span>
            )}
            
            <div 
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.4' }}
              className={`max-w-[95%] sm:max-w-[85%] p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold shadow-sm transition-all duration-200 ${
                msg.isMe 
                  ? `${colors[accentColor] || colors.blue} text-white rounded-tl-none` 
                  : isDark 
                    ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tr-none'
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tr-none'
              }`}
            >
              <p className="whitespace-pre-wrap wrap-break-word">{msg.text}</p>
            </div>
            
            <span className={`text-[8px] sm:text-[9px] font-black mt-1 px-1 uppercase tabular-nums ${
              isDark ? 'text-slate-600' : 'text-slate-400'
            }`}>
              {msg.timestamp}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Padding scales with font size but capped for mobile */}
      <form onSubmit={handleSend} className={`p-3 sm:p-4 border-t transition-colors ${
        isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
      }`}>
        <div className="relative flex items-center">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="הקלד..."
            style={{ fontSize: `${Math.max(fontSize, 14)}px` }} 
            className={`w-full border-none rounded-xl sm:rounded-2xl py-3 sm:py-4 pr-12 sm:pr-14 pl-4 font-bold transition-all text-right outline-none focus:ring-2 ${
              isDark 
                ? 'bg-slate-800 text-white placeholder:text-slate-500 focus:ring-slate-700' 
                : 'bg-slate-50 text-black placeholder:text-slate-400 focus:ring-slate-100'
            }`}
            dir="rtl"
          />
          <button 
            type="submit"
            style={{ 
              padding: `${Math.min(fontSize / 3, 12)}px`,
              right: '0.5rem'
            }}
            className={`absolute rounded-lg sm:rounded-xl text-white transition-all active:scale-90 shadow-md ${
              colors[accentColor] || colors.blue
            }`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              style={{ height: `${Math.max(fontSize, 16)}px`, width: `${Math.max(fontSize, 16)}px` }}
              className="rotate-180" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}