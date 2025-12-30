import React, { useState, useEffect } from 'react';

const ExamTimer = ({ initialSeconds, onTimeUp, isPaused }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

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
      {/* הילה אחורית דינמית */}
      <div className={`absolute -inset-2 rounded-2xl blur-xl transition-opacity duration-1000 opacity-20 
        ${isPaused ? 'bg-amber-500' : isUrgent ? 'bg-rose-600 opacity-40' : 'bg-emerald-500'}`}>
      </div>

      <div className={`relative flex items-center bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border-2 transition-all duration-500
        ${isPaused ? 'border-amber-500/50' : isUrgent ? 'border-rose-500 animate-[pulse_1.5s_infinite]' : 'border-white/10'}`}>
        
        {/* תווית סטטוס - נשארת בצד ימין (RTL) */}
        <div className="flex flex-col border-l border-white/10 pl-4 ml-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">סטטוס</span>
          <span className={`text-[11px] font-bold uppercase italic ${isPaused ? 'text-amber-500' : 'text-emerald-500'}`}>
            {isPaused ? 'מוקפא' : 'פעיל'}
          </span>
        </div>

        {/* מיכל הזמן - מקובע לשמאל לימין כדי למנוע היפוך שעות/שניות */}
        <div className="flex items-center gap-1 font-mono" dir="ltr">
          <TimeUnit value={time.h} label="HR" isUrgent={isUrgent} />
          <span className="text-2xl font-black text-white/20 mb-4">:</span>
          <TimeUnit value={time.m} label="MIN" isUrgent={isUrgent} />
          <span className="text-2xl font-black text-white/20 mb-4">:</span>
          <TimeUnit value={time.s} label="SEC" isUrgent={isUrgent} highlight />
        </div>
      </div>
    </div>
  );
};

const TimeUnit = ({ value, label, isUrgent, highlight }) => (
  <div className="flex flex-col items-center min-w-10.5">
    <span className={`text-3xl font-black tracking-tighter tabular-nums transition-colors duration-300
      ${isUrgent ? 'text-rose-500' : highlight ? 'text-white' : 'text-slate-300'}`}>
      {value}
    </span>
    <span className="text-[8px] font-black text-slate-600 mt-1 uppercase">{label}</span>
  </div>
);

export default ExamTimer;