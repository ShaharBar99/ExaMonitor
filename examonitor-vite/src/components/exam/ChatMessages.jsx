import React, { useState, useRef, useEffect } from 'react';

const ChatMessages = () => {
  // נתוני דמה להתחלה
  const [messages, setMessages] = useState([
    { id: 1, text: "שלום, כאן משגיח קומה 3. האם הכל תקין בחדר 302?", time: "09:00", sender: "משגיח קומה", isMe: false },
    { id: 2, text: "כן, המבחן החל כסדרו. 25 סטודנטים נוכחים.", time: "09:05", sender: "אני", isMe: true },
  ]);

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  // גלילה אוטומטית לסוף בהודעה חדשה
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: "אני",
      isMe: true
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]/30">
      {/* כותרת פנימית קטנה */}
      <div className="px-6 py-3 bg-white/50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">ערוץ משגיחי קומה</span>
        </div>
      </div>

      {/* אזור ההודעות */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        {messages.map((msg) => (
          <div>{msg.text}</div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* תיבת קלט בתחתית */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSendMessage} className="flex gap-2 bg-slate-100 p-2 rounded-[20px] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="כתוב הודעה למשגיח..."
            className="flex-1 bg-transparent border-none outline-none px-3 text-sm font-bold text-slate-700 placeholder:text-slate-400"
          />
          <button 
            type="submit"
            className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatMessages;