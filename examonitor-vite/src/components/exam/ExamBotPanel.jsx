import React, { useState, useRef, useEffect } from "react";
import { botResponses } from "../../mocks/botMessagesMock";

export default function ExamBotPanel() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([
    { role: "bot", text: "שלום, אני העוזר האישי שלך. איך אני יכול לעזור בניהול המבחן?", time: "09:00" }
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { 
      role: "user", 
      text: input, 
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setChat(prev => [...prev, userMsg]);
    setInput("");

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
    <div className="flex flex-col h-full bg-white">
      {/* Header מותאם לסיידבר */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
          <h2 className="font-black text-slate-800 text-lg italic uppercase tracking-tight">ExamBot AI</h2>
        </div>
        <div className="bg-blue-50 px-2 py-1 rounded text-[10px] font-black text-blue-600">ONLINE</div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30 scrollbar-hide"
      >
        {chat.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}>
            <span className="text-[9px] font-black text-slate-400 mb-1 px-1 uppercase">
              {msg.role === 'user' ? 'המשגיח' : 'ExamBot'}
            </span>
            <div className={`max-w-[85%] p-4 rounded-[22px] text-sm font-bold shadow-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none' 
                : 'bg-[#1e293b] text-white rounded-tr-none'
            }`}>
              <p>{msg.text}</p>
              <span className={`text-[8px] mt-2 block opacity-50 font-black ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-300'}`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-white shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSendMessage} className="relative flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="שאל את הבוט..."
            className="w-full pl-4 pr-4 py-3.5 bg-slate-100 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl text-sm transition-all outline-none font-bold text-slate-700"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="p-3 bg-[#1e293b] text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}