import React, { useState, useRef, useEffect } from "react";
import { botHandlers } from "../../handlers/BotHandlers"; 
import { useParams } from "react-router-dom";

export default function ExamBotPanel({ 
  userRole = "supervisor", 
  externalMessage = null, 
  onAction = null, 
  liveStats = null 
}) {
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
  const lastMsgRef = useRef(null); 
  const alertedThresholds = useRef(new Set()); // למניעת הצפת הודעות זהות מהבוט

  // גלילה אוטומטית לסוף הצ'אט
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, isTyping]);

  // 1. לוגיקת הודעות יזומות (Proactive Bot) על בסיס liveStats
  useEffect(() => {
    if (!liveStats || userRole !== 'supervisor') return;

    const addBotAlert = (text, id) => {
      if (alertedThresholds.current.has(id)) return;
      
      setChat(prev => [...prev, {
        role: "bot",
        text,
        isAlert: true,
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      }]);
      alertedThresholds.current.add(id);
    };

    // התראה: עומס בשירותים (מעל 3 סטודנטים בחוץ)
    if (liveStats.out >= 3) {
      addBotAlert(`⚠️ שים לב: כרגע יש ${liveStats.out} סטודנטים מחוץ לכיתה. כדאי לוודא שאין התקהלות במסדרון.`, 'high_out_count');
    } else if (liveStats.out < 2) {
      alertedThresholds.current.delete('high_out_count'); 
    }

    // התראה: אחוז הגשות משמעותי
    if (liveStats.percentFinished >= 50 && liveStats.percentFinished < 90) {
      addBotAlert(`📊 עדכון: כבר ${liveStats.percentFinished}% מהסטודנטים הגישו את המבחן.`, 'half_finished');
    }

  }, [liveStats, userRole]);

  // 2. האזנה להודעות חיצוניות (מהפרוטוקול או מהמערכת)
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
      lastMsgRef.current = externalMessage.text;
    }
  }, [externalMessage]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMsg = { 
      role: "user", 
      text: userText, 
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setChat(prev => [...prev, userMsg]);
    setInput("");

    // --- לוגיקת "תשובות מהירות" מבוססת liveStats ---
    const lowerInput = userText.toLowerCase();
    let quickReply = null;

    if (lowerInput.includes("כמה") && (lowerInput.includes("בחוץ") || lowerInput.includes("שירותים"))) {
      quickReply = `כרגע יש ${liveStats?.out || 0} סטודנטים מחוץ לכיתה. ${liveStats?.longestOutName ? `הסטודנט ${liveStats.longestOutName} נמצא בחוץ הכי הרבה זמן.` : ''}`;
    } else if (lowerInput.includes("מצב") || lowerInput.includes("סטטיסטיקה")) {
      quickReply = `סיכום כיתה נוכחי: 🏠 ${liveStats?.present || 0} בתוך הכיתה, 🚶 ${liveStats?.out || 0} בחוץ, ו-✅ ${liveStats?.submitted || 0} הגישו.`;
    }

    if (quickReply) {
      setIsTyping(true);
      setTimeout(() => {
        setChat(prev => [...prev, {
          role: "bot",
          text: quickReply,
          time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);
      }, 600);
      return;
    }

    // שליחה ל-AI (עם ה-Stats כ-Context)
    await botHandlers.handleSendMessage(
      userText,
      { role: userRole, examId },
      (reply) => setChat(prev => [...prev, reply]),
      setIsTyping,
      {liveStats}
    );
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-inner font-sans" dir="rtl">
      {/* Header */}
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

      {/* Chat Area */}
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
              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

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

      {/* Input Area */}
      <div className="p-6 border-t-2 border-slate-100 bg-white">
        <form onSubmit={handleSendMessage} className="relative flex gap-4">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={isTyping ? "מעבד..." : "שאל אותי על מצב הכיתה או נהלים..."}
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