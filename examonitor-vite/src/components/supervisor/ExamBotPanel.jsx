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

  // גלילה אוטומטית לסוף הצ'אט בכל פעם שיש הודעה חדשה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, isTyping]);

  // האזנה להודעות חיצוניות (פרוטוקול, אזהרות בטיחות, עדכוני זמן)
  useEffect(() => {
    if (externalMessage) {
      const systemMsg = {
        role: "bot",
        text: externalMessage.text,
        options: externalMessage.options || null, // כפתורי פעולה
        isAlert: externalMessage.isAlert || false, // האם זו התראה דחופה
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      };
      setChat(prev => [...prev, systemMsg]);
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

    // קריאה ל-AI Handler
    await botHandlers.handleSendMessage(
      currentInput,
      { role: userRole, examId },
      (reply) => setChat(prev => [...prev, reply]),
      setIsTyping
    );
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-inner font-sans" dir="rtl">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isTyping ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
          <h2 className="font-black text-slate-800 text-lg italic uppercase tracking-tight">
            {userRole === 'supervisor' ? 'ExamBot - עוזר משגיח' : 'ExamBot AI'}
          </h2>
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-black ${isTyping ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {isTyping ? 'מנתח נתונים...' : 'ONLINE'}
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30 scrollbar-hide">
        {chat.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}>
            <span className="text-[9px] font-black text-slate-400 mb-1 px-1 uppercase tracking-widest">
              {msg.role === 'user' ? (userRole === 'lecturer' ? 'המרצה' : 'המשגיח') : 'ExamBot'}
            </span>
            
            <div className={`max-w-[90%] p-4 rounded-[22px] text-sm font-bold shadow-sm leading-relaxed transition-all ${
              msg.role === 'user' 
                ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none' 
                : msg.isAlert 
                  ? 'bg-amber-50 border-2 border-amber-500 text-slate-800 rounded-tr-none'
                  : 'bg-[#1e293b] text-white rounded-tr-none'
            }`}>
              <p>{msg.text}</p>

              {/* לחצני פעולה - מוצגים רק אם נשלחו הודעות עם אופציות (למשל בפרוטוקול) */}
              {msg.options && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {msg.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => onAction && onAction(opt.action)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-[11px] font-black transition-all active:scale-95 shadow-md"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <span className={`text-[8px] mt-2 block opacity-50 font-black ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-300'}`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex flex-col items-end animate-in fade-in duration-300">
             <div className="bg-slate-200/50 p-4 rounded-[22px] rounded-tr-none flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <form onSubmit={handleSendMessage} className="relative flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={isTyping ? "הבוט מעבד נתונים..." : "שאל על זמנים, נוכחות או נהלים..."}
            className="w-full pl-4 pr-4 py-3.5 bg-slate-100 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl text-sm transition-all outline-none font-bold text-slate-700 disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-3 bg-[#1e293b] text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg active:scale-95 disabled:opacity-20"
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