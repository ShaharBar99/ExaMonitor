import React, { useState, useRef, useEffect } from "react";
import { botHandlers } from "../../handlers/BotHandlers"; 
import { useParams } from "react-router-dom";
import { useTheme } from '../state/ThemeContext'; 

export default function ExamBotPanel({ 
  userRole = "supervisor", 
  externalMessage = null, 
  onAction = null, 
  liveStats = null 
}) {
  const { examId } = useParams();
  const { isDark } = useTheme(); 
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // ניהול גודל גופן דינמי (מתחיל ב-24px כפי שביקשת)
  const [fontSize, setFontSize] = useState(24); 

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
  const alertedThresholds = useRef(new Set());

  // פונקציות לשינוי גודל הגופן
  const increaseFont = () => setFontSize(prev => Math.min(prev + 2, 60));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 2, 12));

  // גלילה אוטומטית לתחתית (מופעל גם בשינוי גודל גופן)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, isTyping, fontSize]);

  // לוגיקת התראות אוטומטיות מהבוט
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

    if (liveStats.out >= 3) {
      addBotAlert(`⚠️ שים לב: כרגע יש ${liveStats.out} סטודנטים מחוץ לכיתה. כדאי לוודא שאין התקהלות במסדרון.`, 'high_out_count');
    } else if (liveStats.out < 2) {
      alertedThresholds.current.delete('high_out_count'); 
    }

    if (liveStats.percentFinished >= 50 && liveStats.percentFinished < 90) {
      addBotAlert(`📊 עדכון: כבר ${liveStats.percentFinished}% מהסטודנטים הגישו את המבחן.`, 'half_finished');
    }

  }, [liveStats, userRole]);

  // קבלת הודעות חיצוניות
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

    await botHandlers.handleSendMessage(
      userText,
      { role: userRole, examId },
      (reply) => setChat(prev => [...prev, reply]),
      setIsTyping,
      {liveStats}
    );
  };

  return (
    <div className={`flex flex-col h-full transition-colors font-sans ${isDark ? 'bg-slate-900 shadow-none' : 'bg-white shadow-inner'}`} dir="rtl">
      
      {/* Header עם כפתורי נגישות */}
      <div className={`p-8 border-b-2 flex items-center justify-between sticky top-0 z-20 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-100 backdrop-blur-sm shadow-sm'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${isTyping ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
          <h2 className={`font-black text-2xl italic uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {userRole === 'supervisor' ? 'ExamBot - עוזר משגיח' : 'ExamBot AI'}
          </h2>
        </div>

        <div className="flex items-center gap-6">
          {/* כלי שינוי גודל גופן */}
          <div className={`flex items-center border-2 rounded-2xl overflow-hidden transition-all shadow-sm ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
            <button 
              type="button" 
              onClick={decreaseFont}
              className={`px-5 py-2 font-black transition-all active:scale-90 border-l-2 ${isDark ? 'hover:bg-slate-700 border-slate-700 text-slate-400' : 'hover:bg-slate-200 border-slate-200 text-slate-600'}`}
            >
              A-
            </button>
            <button 
              type="button" 
              onClick={increaseFont}
              className={`px-5 py-2 font-black transition-all active:scale-90 ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}
            >
              A+
            </button>
          </div>

          <div className={`px-4 py-2 rounded-xl text-xl font-black ${
            isTyping ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
          }`}>
            {isTyping ? 'מנתח...' : 'מחובר'}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className={`flex-1 overflow-y-auto p-6 space-y-6 transition-colors scrollbar-hide ${
        isDark ? 'bg-slate-950/50' : 'bg-slate-50/30'
      }`}>
        {chat.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}>
            <span className={`text-sm font-black mb-2 px-2 uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {msg.role === 'user' ? (userRole === 'lecturer' ? 'המרצה' : 'המשגיח') : 'ExamBot'}
            </span>
            
            <div 
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.4' }} 
              className={`max-w-[92%] p-6 rounded-[30px] shadow-md transition-all ${
                msg.role === 'user' 
                  ? (isDark ? 'bg-slate-800 border-2 border-slate-700 text-white rounded-tl-none font-bold' : 'bg-white border-2 border-slate-100 text-slate-700 rounded-tl-none font-bold')
                  : msg.isAlert 
                    ? (isDark ? 'bg-amber-950/40 border-4 border-amber-600 text-amber-100 rounded-tr-none font-black' : 'bg-amber-50 border-4 border-amber-500 text-slate-900 rounded-tr-none font-black')
                    : (isDark ? 'bg-emerald-600 text-white rounded-tr-none font-medium' : 'bg-[#1e293b] text-white rounded-tr-none font-medium')
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

              {/* כפתורי Protocol Steps מותאמים לגודל הגופן */}
              {msg.options && (
                <div className={`mt-6 flex flex-wrap gap-4 ${fontSize > 30 ? 'flex-col' : 'flex-row'}`}>
                  {msg.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => onAction && onAction(opt.action)}
                      style={{ 
                        fontSize: `${Math.max(fontSize * 0.85, 16)}px`,
                        padding: `${fontSize / 1.5}px ${fontSize}px`
                      }}
                      className={`rounded-2xl font-black transition-all active:scale-95 shadow-lg border-b-4 text-center ${
                        isDark 
                          ? 'bg-white text-slate-900 border-slate-300 hover:bg-slate-100' 
                          : 'bg-emerald-500 text-white border-emerald-700 hover:bg-emerald-600'
                      }`}
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
             <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-200/50'} p-6 rounded-[30px] rounded-tr-none flex gap-2`}>
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`p-6 border-t-2 transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <form onSubmit={handleSendMessage} className="relative flex gap-4">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            style={{ fontSize: `${Math.max(fontSize * 0.8, 18)}px` }} 
            placeholder={isTyping ? "מעבד..." : "שאל אותי על מצב הכיתה או נהלים..."}
            className={`w-full pl-6 pr-6 py-6 border-4 focus:bg-transparent rounded-[25px] transition-all outline-none font-bold disabled:opacity-50 ${
              isDark 
                ? 'bg-slate-800 border-transparent focus:border-emerald-500/40 text-white placeholder:text-slate-500' 
                : 'bg-slate-100 border-transparent focus:border-emerald-500/20 text-slate-700'
            }`}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className={`px-8 rounded-[25px] transition-all shadow-xl active:scale-95 disabled:opacity-20 flex items-center justify-center ${
              isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-[#1e293b] text-white hover:bg-emerald-600'
            }`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              style={{ 
                height: `${Math.max(fontSize * 1.2, 28)}px`, 
                width: `${Math.max(fontSize * 1.2, 28)}px` 
              }}
              className="rotate-180" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}