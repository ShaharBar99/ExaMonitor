import React, { useState, useEffect } from 'react';
import { useTheme } from '../state/ThemeContext'; // ייבוא ה-Theme

const ExamTimer = ({ initialSeconds, onTimeUp, isPaused }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const { isDark } = useTheme();

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;

    const timerId = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, [secondsLeft, isPaused]);

  useEffect(() => {
    if (secondsLeft === 0 && onTimeUp) {
      onTimeUp();
    }
  }, [secondsLeft, onTimeUp]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return {
      h: hrs.toString().padStart(2, '0'),
      m: mins.toString().padStart(2, '0'),
      s: secs.toString().padStart(2, '0')
    };
  };

  const time = formatTime(secondsLeft);
  const isUrgent = secondsLeft < 600 && secondsLeft > 0;

  return (
    <div className="relative group select-none">
      {/* הילה אחורית דינמית - מוחלשת מעט במצב בהיר */}
      <div className={`absolute -inset-2 rounded-2xl blur-xl transition-opacity duration-1000 
        ${isDark ? 'opacity-20' : 'opacity-10'} 
        ${isPaused ? 'bg-amber-500' : isUrgent ? 'bg-rose-600 opacity-40' : 'bg-emerald-500'}`}>
      </div>

      <div className={`relative flex items-center backdrop-blur-md px-6 py-3 rounded-2xl border-2 transition-all duration-500
        ${isDark ? 'bg-black/40 border-white/10' : 'bg-slate-900 border-slate-800 shadow-xl'}
        ${isPaused ? 'border-amber-500/50!' : isUrgent ? 'border-rose-500! animate-[pulse_1.5s_infinite]' : ''}`}>
        
        {/* תווית סטטוס */}
        <div className={`flex flex-col border-l pl-4 ml-2 ${isDark ? 'border-white/10' : 'border-white/5'}`}>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1 ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>סטטוס</span>
          <span className={`text-[11px] font-bold uppercase italic ${isPaused ? 'text-amber-500' : 'text-emerald-500'}`}>
            {isPaused ? 'מוקפא' : 'פעיל'}
          </span>
        </div>

        {/* מיכל הזמן - תמיד LTR */}
        <div className="flex items-center gap-1 font-mono" dir="ltr">
          <TimeUnit value={time.h} label="HR" isUrgent={isUrgent} isDark={isDark} />
          <span className={`text-2xl font-black mb-4 ${isDark ? 'text-white/20' : 'text-white/10'}`}>:</span>
          <TimeUnit value={time.m} label="MIN" isUrgent={isUrgent} isDark={isDark} />
          <span className={`text-2xl font-black mb-4 ${isDark ? 'text-white/20' : 'text-white/10'}`}>:</span>
          <TimeUnit value={time.s} label="SEC" isUrgent={isUrgent} isDark={isDark} highlight />
        </div>
      </div>
    </div>
  );
};

const TimeUnit = ({ value, label, isUrgent, highlight, isDark }) => (
  <div className="flex flex-col items-center min-w-10.5">
    <span className={`text-3xl font-black tracking-tighter tabular-nums transition-colors duration-300
      ${isUrgent ? 'text-rose-500' : highlight ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-200'}`}>
      {value}
    </span>
    <span className={`text-[8px] font-black mt-1 uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
      {label}
    </span>
  </div>
);

export default ExamTimer;