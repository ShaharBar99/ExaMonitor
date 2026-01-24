import React, { useState, useRef, useEffect } from "react";
import { botHandlers } from "../../handlers/BotHandlers"; 
import { useParams } from "react-router-dom";
import { useTheme } from '../state/ThemeContext'; 

export default function ExamBotPanel({ 
  userRole = "supervisor", 
  externalMessage = null, 
  onAction = null, 
  liveStats = null,
  userName = "משגיח"
}) {
  const { examId } = useParams();
  const { isDark } = useTheme(); 
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Dynamic font size management
  const [fontSize, setFontSize] = useState(24); 

  const [chat, setChat] = useState([
    { 
      role: "bot", 
      text: userRole === 'supervisor' 
        ? `שלום ${userName}! אני כאן כדי ללוות אותך בניהול המבחן לפי הפרוטוקול. איך אוכל לעזור?`
        : "שלום, אני העוזר האישי שלך. איך אני יכול לעזור בניהול המבחן?", 
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  
  const scrollRef = useRef(null);
  const lastMsgRef = useRef(null); 
  const alertedThresholds = useRef(new Set());

  const increaseFont = () => setFontSize(prev => Math.min(prev + 2, 60));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 2, 12));

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, isTyping, fontSize]);

  // Bot logic for automatic alerts
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

    if (liveStats.out >= 2) {
      addBotAlert(`⚠️ שים לב: כרגע יש ${liveStats.out} סטודנטים מחוץ לכיתה. כדאי לוודא שאין התקהלות במסדרון.`, 'high_out_count');
    } else if (liveStats.out < 2) {
      alertedThresholds.current.delete('high_out_count'); 
    }

    if (liveStats.percentFinished >= 50 && liveStats.percentFinished < 90) {
      addBotAlert(`📊 עדכון: כבר ${liveStats.percentFinished}% מהסטודנטים הגישו את המבחן.`, 'half_finished');
    }

  }, [liveStats, userRole]);

  // External messages handler
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
    <div className={`flex flex-col h-full w-full max-w-full overflow-hidden transition-colors font-sans box-border ${isDark ? 'bg-slate-900 shadow-none' : 'bg-white shadow-inner'}`} dir="rtl">
      
      {/* Header */}
      <div className={`shrink-0 p-4 border-b-2 flex flex-col items-center justify-between sticky top-0 z-20 transition-colors gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-100 backdrop-blur-sm shadow-sm'
      }`}>
        <div className="flex items-center gap-3 w-full justify-center">
          <div className={`w-3 h-3 rounded-full ${isTyping ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
          <h2 className={`font-black text-lg md:text-xl italic uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {userRole === 'supervisor' ? 'ExamBot - עוזר משגיח' : 'ExamBot AI'}
          </h2>
        </div>

        <div className="flex items-center justify-center w-full gap-4">
          <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-all shadow-sm ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
            <button 
              type="button" 
              onClick={decreaseFont}
              className={`px-4 py-1 font-black text-sm transition-all active:scale-90 border-l-2 ${isDark ? 'hover:bg-slate-700 border-slate-700 text-slate-400' : 'hover:bg-slate-200 border-slate-200 text-slate-600'}`}
            >
              A-
            </button>
            <button 
              type="button" 
              onClick={increaseFont}
              className={`px-4 py-1 font-black text-sm transition-all active:scale-90 ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className={`flex-1 overflow-y-auto p-4 space-y-6 transition-colors scrollbar-hide ${
        isDark ? 'bg-slate-950/50' : 'bg-slate-50/30'
      }`}>
        {chat.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'} w-full`}>
            <span className={`text-[10px] font-black mb-1 px-2 uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {msg.role === 'user' ? (userRole === 'lecturer' ? 'המרצה' : 'המשגיח') : 'ExamBot'}
            </span>
            
            <div 
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.4' }} 
              className={`max-w-[85%] p-4 rounded-2xl shadow-md transition-all break words overflow-hidden ${
                msg.role === 'user' 
                  ? (isDark ? 'bg-slate-800 border-2 border-slate-700 text-white rounded-tl-none font-bold' : 'bg-white border-2 border-slate-100 text-slate-700 rounded-tl-none font-bold')
                  : msg.isAlert 
                    ? (isDark ? 'bg-amber-950/40 border-2 border-amber-600 text-amber-100 rounded-tr-none font-black' : 'bg-amber-50 border-2 border-amber-500 text-slate-900 rounded-tr-none font-black')
                    : (isDark ? 'bg-emerald-600 text-white rounded-tr-none font-medium' : 'bg-[#1e293b] text-white rounded-tr-none font-medium')
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

              {msg.options && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {msg.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => onAction && onAction(opt.action)}
                      style={{ 
                        fontSize: `${Math.max(fontSize * 0.65, 14)}px`,
                        padding: '8px 16px'
                      }}
                      className={`rounded-xl font-black transition-all active:scale-95 shadow-lg border-b-4 text-center ${
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

              <span className={`text-[10px] mt-2 block opacity-60 font-black ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-300'}`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex flex-col items-end">
             <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-200/50'} p-4 rounded-2xl rounded-tr-none flex gap-2`}>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`shrink-0 p-4 border-t-2 transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center w-full">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            style={{ fontSize: '18px' }} 
            placeholder={isTyping ? "מעבד..." : "שאל אותי..."}
            className={`flex-1 min-w-0 px-4 py-3 border-2 focus:bg-transparent rounded-xl transition-all outline-none font-bold disabled:opacity-50 ${
              isDark 
                ? 'bg-slate-800 border-transparent focus:border-emerald-500/40 text-white placeholder:text-slate-500' 
                : 'bg-slate-100 border-transparent focus:border-emerald-500/20 text-slate-700'
            }`}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className={`shrink-0 w-12 h-12 rounded-xl transition-all shadow-xl active:scale-95 disabled:opacity-20 flex items-center justify-center ${
              isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-[#1e293b] text-white hover:bg-emerald-600'
            }`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 rotate-180" 
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