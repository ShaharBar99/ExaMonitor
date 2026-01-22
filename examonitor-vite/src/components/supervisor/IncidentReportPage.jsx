import React, { useState } from 'react';
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
    roomNumber: classrooms?.room_number || '',
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

  const goBackToExam = () => {
    if (onBack) onBack(); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await incidentHandlers.submitReport(formData, user.id);
    socket.emit('new_incident', formData);
    goBackToExam();
  };

  return (
    <div className={`min-h-screen p-4 md:p-16 text-right font-sans transition-colors duration-300 ${isDark ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      
      {/* Header Section - Stacked on mobile, side-by-side on desktop */}
      <header className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-20 gap-6">
        <div className="flex items-center gap-4 md:gap-10">
          <button 
            type="button"
            onClick={goBackToExam} 
            className={`w-14 h-14 md:w-20 md:h-20 flex items-center justify-center border-2 rounded-2xl md:rounded-[25px] transition-all active:scale-90 ${
              isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <span className="text-xl md:text-3xl text-rose-500">➜</span>
          </button>
          <div>
            <h1 className={`text-3xl md:text-6xl font-black italic uppercase tracking-tighter leading-none mb-2 md:mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Report Incident
            </h1>
            <div className="flex items-center gap-3 md:gap-4">
              <span className="w-2 h-2 md:w-4 md:h-4 bg-rose-500 rounded-full animate-ping"></span>
              <p className="text-slate-400 font-black text-sm md:text-2xl uppercase tracking-widest md:tracking-[0.2em]">בקרת אירועים בזמן אמת</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-500/20">
            <span className="text-xs md:text-xl font-black text-slate-500 uppercase tracking-widest md:mb-2">Time of Incident</span>
            <span className="text-2xl md:text-5xl font-black font-mono text-rose-500">{formData.time}</span>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-5xl mx-auto">
        <div className={`rounded-[30px] md:rounded-[55px] shadow-2xl overflow-hidden border transition-colors duration-300 ${
          isDark ? 'bg-slate-900 border-white/10 shadow-black/60' : 'bg-white border-slate-200 shadow-slate-200'
        }`}>
          
          <div className="bg-rose-600 p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <p className="text-white font-black text-sm md:text-xl italic uppercase tracking-tight">
              ⚠️ שים לב: דיווח מתועד ונשלח למנהל
            </p>
            <span className="text-rose-200 text-xs md:text-lg font-bold opacity-60 font-mono">INC-CODE: {examId?.slice(-4)}</span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-20 space-y-8 md:space-y-14">
            
            {/* Input Groups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14">
              <div className="space-y-3 md:space-y-5">
                <label className="text-sm md:text-2xl font-black text-slate-400 uppercase tracking-widest pr-2">מספר חדר</label>
                <input 
                  required
                  type="text" 
                  value={formData.roomNumber}
                  className={`w-full border-2 md:border-4 rounded-2xl md:rounded-[30px] py-4 md:py-7 px-6 md:px-10 text-xl md:text-3xl font-black transition-all outline-none ${
                    isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-rose-500' 
                    : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-rose-500'
                  }`}
                  onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                />
              </div>

              <div className="space-y-3 md:space-y-5">
                <label className="text-sm md:text-2xl font-black text-slate-400 uppercase tracking-widest pr-2">ת.ז. סטודנט</label>
                <input 
                  type="text" 
                  className={`w-full border-2 md:border-4 rounded-2xl md:rounded-[30px] py-4 md:py-7 px-6 md:px-10 text-xl md:text-3xl font-black transition-all outline-none ${
                    isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-rose-500' 
                    : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-rose-500'
                  }`}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14">
              <div className="space-y-3 md:space-y-5">
                <label className="text-sm md:text-2xl font-black text-slate-400 uppercase tracking-widest pr-2">סיווג האירוע</label>
                <div className="relative">
                  <select 
                    required
                    className={`w-full border-2 md:border-4 rounded-2xl md:rounded-[30px] py-4 md:py-7 px-6 md:px-10 text-xl md:text-3xl font-black transition-all outline-none appearance-none cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'
                    }`}
                    onChange={(e) => setFormData({...formData, incidentType: e.target.value})}
                  >
                    <option value="">בחר...</option>
                    {incidentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <div className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg md:text-2xl">▼</div>
                </div>
              </div>

              <div className="space-y-3 md:space-y-5">
                <label className="text-sm md:text-2xl font-black text-slate-400 uppercase tracking-widest pr-2">רמת חומרה</label>
                <div className="flex gap-2 md:gap-5 h-16 md:h-24">
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
                      <div className={`h-full flex items-center justify-center rounded-xl md:rounded-[25px] font-black text-xs md:text-xl uppercase tracking-widest transition-all ${
                        isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
                      } ${lvl.color}`}>
                        {lvl.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 md:space-y-5">
              <label className="text-sm md:text-2xl font-black text-slate-400 uppercase tracking-widest pr-2">תיאור מפורט</label>
              <textarea 
                required
                rows="4"
                className={`w-full border-2 md:border-4 rounded-[25px] md:rounded-[40px] py-6 md:py-10 px-6 md:px-10 text-xl md:text-3xl font-bold transition-all outline-none resize-none leading-relaxed ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'
                }`}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>

            {/* Action Buttons - Full width on mobile */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 pt-6 md:pt-10">
              <button 
                type="submit"
                className={`flex-2 py-6 md:py-10 rounded-2xl md:rounded-[30px] font-black text-lg md:text-2xl uppercase tracking-widest md:tracking-[0.2em] transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-4 md:gap-6 ${
                  isDark ? 'bg-white text-slate-900 hover:bg-rose-500 hover:text-white' : 'bg-slate-900 text-white hover:bg-rose-600'
                }`}
              >
                <span className="hidden sm:inline">SEND REPORT</span>
                <span className="opacity-30 text-2xl md:text-4xl">|</span>
                <span>שליחת דיווח חריג</span>
              </button>
              
              <button 
                type="button"
                onClick={goBackToExam}
                className={`flex-1 border-2 md:border-4 py-6 md:py-10 rounded-2xl md:rounded-[30px] font-black text-sm md:text-xl uppercase tracking-widest transition-all active:scale-95 ${
                  isDark ? 'bg-transparent border-slate-700 text-slate-500' : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                ביטול
              </button>
            </div>
          </form>
        </div>

        <p className="mt-8 md:mt-16 text-center text-[10px] md:text-xl font-black text-slate-600 uppercase tracking-[0.2em] md:tracking-[0.4em] opacity-40">
          Digital Incident Logging System • Version 4.0.1
        </p>
      </main>
    </div>
  );
}