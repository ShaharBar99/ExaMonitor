import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { incidentHandlers } from '../../handlers/incidentHandlers';
import { useAuth } from '../state/AuthContext';
import { useSocket } from '../state/SocketContext';
import { useTheme } from '../state/ThemeContext';

export default function IncidentReportPage({ examId, classrooms, onBack } ) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const socket = useSocket();

  const [formData, setFormData] = useState({
    examId: examId || '',
    roomNumber: classrooms.room_number || '',
    studentId: '',
    incidentType: '',
    severity: 'medium',
    description: '',
    time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
  });

  const incidentTypes = [
    "חשד להעתקה",
    "הפרעת משמעת",
    "יציאה חריגה מהכיתה",
    "תקלה טכנית (מחשב/תוכנה)",
    "בעיה רפואית",
    "אחר"
  ];

  // פונקציית עזר לחזרה למבחן (לטאב ה-Attendance)
  const goBackToExam = () => {
    // מנווט חזרה לעמוד המבחן. המערכת שלך כבר תטען את טאב ברירת המחדל (Attendance)
    if (onBack) {
      onBack(); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // כאן תבוא הלוגיקה של שליחת הדיווח ל-DB
    await incidentHandlers.submitReport(formData, user.id); // העברת ה-ID של המדווח
    socket.emit('new_incident', formData);
    goBackToExam();
  };

  return (
    <div className={`min-h-screen p-8 md:p-16 text-right font-sans transition-colors duration-300 ${isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      
      {/* Header Section */}
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-20">
        <div className="flex items-center gap-10">
          <button 
            type="button"
            onClick={goBackToExam} 
            className={`w-20 h-20 flex items-center justify-center border-2 rounded-[25px] transition-all active:scale-90 ${
              isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <span className="text-3xl text-rose-500">➜</span>
          </button>
          <div>
            <h1 className={`text-6xl font-black italic uppercase tracking-tighter leading-none mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Report Incident
            </h1>
            <div className="flex items-center gap-4">
              <span className="w-4 h-4 bg-rose-500 rounded-full animate-ping"></span>
              <p className="text-slate-400 font-black text-2xl uppercase tracking-[0.2em]">בקרת אירועים בזמן אמת</p>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex flex-col items-end">
            <span className="text-xl font-black text-slate-500 uppercase tracking-widest mb-2">Time of Incident</span>
            <span className="text-5xl font-black font-mono text-rose-500">{formData.time}</span>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-5xl mx-auto">
        <div className={`rounded-[55px] shadow-2xl overflow-hidden border transition-colors duration-300 ${
          isDark ? 'bg-slate-900 border-white/10 shadow-black/60' : 'bg-white border-slate-200 shadow-slate-200'
        }`}>
          
          <div className="bg-rose-600 p-10 flex items-center justify-between">
            <p className="text-white font-black text-xl italic uppercase tracking-tight">
              ⚠️ שים לב: דיווח זה מתועד ביומן הבחינה ונשלח מיידית למנהל
            </p>
            <span className="text-rose-200 text-lg font-bold opacity-60 font-mono">INC-CODE: {examId?.slice(-4)}</span>
          </div>

          <form onSubmit={handleSubmit} className="p-16 md:p-20 space-y-14">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
              <div className="space-y-5">
                <label className="text-2xl font-black text-slate-400 uppercase tracking-widest pr-4">מספר חדר / מיקום</label>
                <input 
                  required
                  type="text" 
                  value={formData.roomNumber}
                  className={`w-full border-4 rounded-[30px] py-7 px-10 text-3xl font-black transition-all outline-none ${
                    isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-rose-500 focus:bg-slate-700' 
                    : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-rose-500 focus:bg-white'
                  }`}
                  onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                />
              </div>

              <div className="space-y-5">
                <label className="text-2xl font-black text-slate-400 uppercase tracking-widest pr-4">ת.ז. סטודנט מעורב</label>
                <input 
                  type="text" 
                  className={`w-full border-4 rounded-[30px] py-7 px-10 text-3xl font-black transition-all outline-none ${
                    isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-rose-500 focus:bg-slate-700' 
                    : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-rose-500 focus:bg-white'
                  }`}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
              <div className="space-y-5">
                <label className="text-2xl font-black text-slate-400 uppercase tracking-widest pr-4">סיווג האירוע</label>
                <div className="relative">
                  <select 
                    required
                    className={`w-full border-4 rounded-[30px] py-7 px-10 text-3xl font-black transition-all outline-none appearance-none cursor-pointer ${
                      isDark 
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-rose-500' 
                      : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-rose-500'
                    }`}
                    onChange={(e) => setFormData({...formData, incidentType: e.target.value})}
                  >
                    <option value="">בחר מהרשימה...</option>
                    {incidentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-2xl">▼</div>
                </div>
              </div>

              <div className="space-y-5">
                <label className="text-2xl font-black text-slate-400 uppercase tracking-widest pr-4">רמת חומרה</label>
                <div className="flex gap-5 h-24">
                  {[
                    {id: 'low', label: 'רגיל', color: isDark ? 'peer-checked:bg-white peer-checked:text-slate-900' : 'peer-checked:bg-slate-900 peer-checked:text-white'},
                    {id: 'medium', label: 'בינוני', color: 'peer-checked:bg-amber-500 peer-checked:text-white'},
                    {id: 'high', label: 'דחוף', color: 'peer-checked:bg-rose-600 peer-checked:text-white'}
                  ].map((lvl) => (
                    <label key={lvl.id} className="flex-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="severity" 
                        className="peer hidden" 
                        checked={formData.severity === lvl.id}
                        onChange={() => setFormData({...formData, severity: lvl.id})} 
                      />
                      <div className={`h-full flex items-center justify-center rounded-[25px] font-black text-xl uppercase tracking-widest transition-all shadow-sm ${
                        isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
                      } ${lvl.color}`}>
                        {lvl.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <label className="text-2xl font-black text-slate-400 uppercase tracking-widest pr-4">תיאור מפורט של המקרה</label>
              <textarea 
                required
                rows="6"
                className={`w-full border-4 rounded-[40px] py-10 px-10 text-3xl font-bold transition-all outline-none resize-none leading-relaxed ${
                  isDark 
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-rose-500' 
                  : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-rose-500'
                }`}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-8 pt-10">
              <button 
                type="submit"
                className={`flex-[2] py-10 rounded-[30px] font-black text-2xl uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-6 ${
                  isDark ? 'bg-white text-slate-900 hover:bg-rose-500 hover:text-white' : 'bg-slate-900 text-white hover:bg-rose-600'
                }`}
              >
                <span>SEND REPORT</span>
                <span className="opacity-30 text-4xl">|</span>
                <span>שליחת דיווח חריג</span>
              </button>
              
              <button 
                type="button"
                onClick={goBackToExam}
                className={`flex-1 border-4 py-10 rounded-[30px] font-black text-xl uppercase tracking-widest transition-all active:scale-95 ${
                  isDark ? 'bg-transparent border-slate-700 text-slate-500 hover:bg-slate-800' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                }`}
              >
                ביטול וחזרה
              </button>
            </div>
          </form>
        </div>

        <p className="mt-16 text-center text-xl font-black text-slate-600 uppercase tracking-[0.4em] opacity-40">
          Digital Incident Logging System • Version 4.0.1
        </p>
      </main>
    </div>
  );
}