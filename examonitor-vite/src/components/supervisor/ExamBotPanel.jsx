import React, { useState, useRef, useEffect } from "react";
import { botHandlers } from "../../handlers/BotHandlers"; 
import { useParams } from "react-router-dom";

export default function ExamBotPanel({ userRole = "supervisor", externalMessage = null, onAction = null }) {
  const { examId } = useParams();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chat, setChat] = useState([
    { 
      role: "bot", 
      text: userRole === 'supervisor' 
        ? "שלום משגיח! אני כאן כדי ללוות אותך בניהול המבחן לפי הפרוטוקול. איך אוכל לעזור?" 
        : "שלום, אני העוזר האישי שלך. איך אני יכול לעזור בניהול המבחן?", 
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const scrollRef = useRef(null);
  const lastMsgRef = useRef(null); // רפרנס למניעת הודעות כפולות

  // גלילה אוטומטית לסוף הצ'אט
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, isTyping]);

  // האזנה להודעות חיצוניות - עם מנגנון מניעת כפילות
  useEffect(() => {
    if (externalMessage && externalMessage.text !== lastMsgRef.current) {
      const systemMsg = {
        role: "bot",
        text: externalMessage.text,
        options: externalMessage.options || null,
        isAlert: externalMessage.isAlert || false,
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      };
      
      setChat(prev => [...prev, systemMsg]);
      lastMsgRef.current = externalMessage.text; // שמירת ההודעה האחרונה למניעת חזרה
    }
  }, [externalMessage]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = { 
      role: "user", 
      text: input, 
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setChat(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    await botHandlers.handleSendMessage(
      currentInput,
      { role: userRole, examId },
      (reply) => setChat(prev => [...prev, reply]),
      setIsTyping
    );
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-inner font-sans" dir="rtl">
      
      {/* Header - מוגדל */}
      <div className="p-8 border-b-2 border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${isTyping ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
          <h2 className="font-black text-slate-800 text-2xl italic uppercase tracking-tight">
            {userRole === 'supervisor' ? 'ExamBot - עוזר משגיח' : 'ExamBot AI'}
          </h2>
        </div>
        <div className={`px-4 py-2 rounded-xl text-xl font-black ${isTyping ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {isTyping ? 'מנתח...' : 'מחובר'}
        </div>
      </div>

      {/* Chat Area - טקסט הודעות מוגדל */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 scrollbar-hide">
        {chat.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}>
            <span className="text-sm font-black text-slate-400 mb-2 px-2 uppercase tracking-widest">
              {msg.role === 'user' ? (userRole === 'lecturer' ? 'המרצה' : 'המשגיח') : 'ExamBot'}
            </span>
            
            <div className={`max-w-[92%] p-6 rounded-[30px] shadow-md leading-relaxed transition-all ${
              msg.role === 'user' 
                ? 'bg-white border-2 border-slate-100 text-slate-700 rounded-tl-none text-2xl font-bold' 
                : msg.isAlert 
                  ? 'bg-amber-50 border-4 border-amber-500 text-slate-900 rounded-tr-none text-2xl font-black'
                  : 'bg-[#1e293b] text-white rounded-tr-none text-2xl font-medium'
            }`}>
              <p>{msg.text}</p>

              {/* לחצני פעולה - מוגדלים משמעותית */}
              {msg.options && (
                <div className="mt-6 flex flex-wrap gap-4">
                  {msg.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => onAction && onAction(opt.action)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl text-xl font-black transition-all active:scale-95 shadow-lg border-b-4 border-emerald-700"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <span className={`text-xs mt-3 block opacity-60 font-black ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-300'}`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex flex-col items-end animate-in fade-in duration-300">
             <div className="bg-slate-200/50 p-6 rounded-[30px] rounded-tr-none flex gap-2">
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area - שדה קלט ענק */}
      <div className="p-6 border-t-2 border-slate-100 bg-white">
        <form onSubmit={handleSendMessage} className="relative flex gap-4">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={isTyping ? "מעבד..." : "כתוב הודעה כאן..."}
            className="w-full pl-6 pr-6 py-6 bg-slate-100 border-4 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-[25px] text-2xl transition-all outline-none font-bold text-slate-700 disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-8 bg-[#1e293b] text-white rounded-[25px] hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-20 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}