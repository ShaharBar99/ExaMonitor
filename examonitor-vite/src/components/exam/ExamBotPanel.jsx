import React, { useState, useRef, useEffect } from "react";
import { botResponses } from "../../mocks/botMessagesMock";
const ExamBotPanel = () => {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([
    { role: "bot", text: "שלום, אני העוזר האישי שלך. איך אני יכול לעזור בניהול המבחן?", time: "09:00" }
  ]);
  const scrollRef = useRef(null);

  // גלילה אוטומטית לסוף הצ'אט
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // הוספת הודעת המשתמש
    const userMsg = { role: "user", text: input, time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) };
    setChat(prev => [...prev, userMsg]);
    setInput("");

    // מענה דמה של הבוט לאחר השהייה קלה
    setTimeout(() => {

      const randomReply = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      setChat(prev => [...prev, { 
        role: "bot", 
        text: randomReply, 
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) 
      }]);
    }, 1000);
  };

  return (
    <aside className="w-80 bg-white border-l border-slate-100 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <h2 className="font-black text-slate-800 text-lg">ExamBot Helper</h2>
        </div>
        <div className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-500">LIVE</div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30"
      >
        {chat.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-white border border-slate-200 text-slate-700 rounded-tr-none' 
                : 'bg-blue-600 text-white rounded-tl-none'
            }`}>
              <p>{msg.text}</p>
              <span className={`text-[9px] mt-1 block opacity-60 ${msg.role === 'user' ? 'text-slate-400' : 'text-blue-100'}`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <form onSubmit={handleSendMessage} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="שאל את הבוט או בקש פעולה..."
            className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
          />
          <button 
            type="submit"
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
        <p className="text-[9px] text-slate-400 text-center mt-3 font-bold uppercase tracking-tighter">
          הבוט זמין לשאלות על נוכחות, זמנים ודיווחים
        </p>
      </div>
    </aside>
  );
};

export default ExamBotPanel;