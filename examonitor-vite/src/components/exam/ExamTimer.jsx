import React, { useState, useEffect } from 'react';

const ExamTimer = ({ initialSeconds, onTimeUp }) => {
  // אתחול ה-State
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  // --- תוספת חשובה: עדכון השעון כשהערך הראשוני מגיע מה-API ---
  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const timerId = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [secondsLeft, onTimeUp]);

  const formatTime = (totalSeconds) => {
    if (totalSeconds < 0) return "00:00:00";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [hrs, mins, secs]
      .map((v) => (v < 10 ? "0" + v : v))
      .join(":");
  };

  const isUrgent = secondsLeft < 600;

  return (
    <div className="flex flex-col items-end">
      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">זמן נותר</span>
      <span className={`text-lg font-mono font-black transition-colors duration-500 ${
        isUrgent ? 'text-red-600 animate-pulse' : 'text-slate-700'
      }`}>
        {formatTime(secondsLeft)}
      </span>
    </div>
  );
};

export default ExamTimer;