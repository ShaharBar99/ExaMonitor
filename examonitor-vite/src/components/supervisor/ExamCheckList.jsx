import React, { useState } from 'react';

const ExamChecklist = ({ onComplete }) => {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'בדיקת תעודות זהות בכניסה', completed: false },
    { id: 2, text: 'וידוא טלפונים כבויים בתוך התיקים', completed: false },
    { id: 3, text: 'חלוקת טופסי בחינה ומחברות', completed: false },
    { id: 4, text: 'הקראת הוראות לנבחנים', completed: false },
    { id: 5, text: 'וידוא שכל הסטודנטים רשומים במערכת', completed: false }
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const allDone = tasks.every(t => t.completed);

  return (
    <div className="bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-xl max-w-2xl mx-auto mt-10" dir="rtl">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
        <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">📋</span>
        צ'ק-ליסט פתיחת בחינה
      </h3>
      
      <div className="space-y-4">
        {tasks.map(task => (
          <div 
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2 
              ${task.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
          >
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
              ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}>
              {task.completed && <span className="text-white text-xs">✓</span>}
            </div>
            <span className={`font-bold text-sm ${task.completed ? 'text-emerald-700 line-through' : 'text-slate-600'}`}>
              {task.text}
            </span>
          </div>
        ))}
      </div>

      <button
        disabled={!allDone}
        onClick={onComplete}
        className={`w-full mt-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all
          ${allDone ? 'bg-slate-900 text-white shadow-lg hover:bg-emerald-600' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
      >
        התחל בחינה רשמית
      </button>
    </div>
  );
};

export default ExamChecklist;