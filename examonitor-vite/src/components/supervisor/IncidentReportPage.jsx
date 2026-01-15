import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function IncidentReportPage() {
  const navigate = useNavigate();
  const { examId } = useParams(); // שליפת ה-ID של המבחן מהכתובת
  
  const [formData, setFormData] = useState({
    examId: examId || '',
    roomNumber: '',
    studentId: '',
    incidentType: '',
    severity: 'medium',
    description: '',
    time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
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
    window.location.href = `/exam/active/${examId}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // כאן תבוא הלוגיקה של שליחת הדיווח ל-DB
    console.log("Report Submitted:", formData);
    goBackToExam();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-8 md:p-16 text-right text-white font-sans" dir="rtl">
      
      {/* Header Section */}
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-20">
        <div className="flex items-center gap-10">
          <button 
            type="button"
            onClick={goBackToExam} 
            className="w-20 h-20 flex items-center justify-center bg-white/5 border-2 border-white/10 rounded-[25px] hover:bg-white/10 hover:border-white/20 transition-all active:scale-90"
          >
            <span className="text-3xl text-rose-500">➜</span>
          </button>
          <div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-4">Report Incident</h1>
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
        <div className="bg-white rounded-[55px] shadow-2xl shadow-black/60 overflow-hidden border border-white/10">
          
          <div className="bg-rose-600 p-10 flex items-center justify-between">
            <p className="text-white font-black text-xl italic uppercase tracking-tight">
              ⚠️ שים לב: דיווח זה מתועד ביומן הבחינה הדיגיטלי ונשלח מיידית למנהל הקומה
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
                  className="w-full bg-slate-50 border-4 border-slate-100 focus:border-rose-500 focus:bg-white rounded-[30px] py-7 px-10 text-3xl text-slate-900 font-black transition-all outline-none"
                  onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                />
              </div>

              <div className="space-y-5">
                <label className="text-2xl font-black text-slate-400 uppercase tracking-widest pr-4">ת.ז. סטודנט מעורב</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-4 border-slate-100 focus:border-rose-500 focus:bg-white rounded-[30px] py-7 px-10 text-3xl text-slate-900 font-black transition-all outline-none"
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
                    className="w-full bg-slate-50 border-4 border-slate-100 focus:border-rose-500 focus:bg-white rounded-[30px] py-7 px-10 text-3xl text-slate-900 font-black transition-all outline-none appearance-none cursor-pointer"
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
                    {id: 'low', label: 'רגיל', color: 'peer-checked:bg-slate-900'},
                    {id: 'medium', label: 'בינוני', color: 'peer-checked:bg-amber-500'},
                    {id: 'high', label: 'דחוף', color: 'peer-checked:bg-rose-600'}
                  ].map((lvl) => (
                    <label key={lvl.id} className="flex-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="severity" 
                        className="peer hidden" 
                        checked={formData.severity === lvl.id}
                        onChange={() => setFormData({...formData, severity: lvl.id})} 
                      />
                      <div className={`h-full flex items-center justify-center rounded-[25px] bg-slate-100 text-slate-400 font-black text-xl uppercase tracking-widest transition-all peer-checked:text-white peer-checked:shadow-2xl ${lvl.color}`}>
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
                className="w-full bg-slate-50 border-4 border-slate-100 focus:border-rose-500 focus:bg-white rounded-[40px] py-10 px-10 text-3xl text-slate-900 font-bold transition-all outline-none resize-none leading-relaxed"
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>

            {/* כפתורי פעולה */}
            <div className="flex flex-col md:flex-row gap-8 pt-10">
              <button 
                type="submit"
                className="flex-2 bg-slate-900 text-white py-10 rounded-[30px] font-black text-2xl uppercase tracking-[0.2em] hover:bg-rose-600 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-6"
              >
                <span>SEND REPORT</span>
                <span className="opacity-30 text-4xl">|</span>
                <span>שליחת דיווח חריג</span>
              </button>
              
              <button 
                type="button"
                onClick={goBackToExam} // שינוי כאן: חזרה ישירה למבחן
                className="flex-1 bg-white border-4 border-slate-100 text-slate-400 py-10 rounded-[30px] font-black text-xl uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
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