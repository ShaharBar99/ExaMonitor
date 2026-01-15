import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function IncidentReportPage(examId, classroom) {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    examId: examId || '',
    roomNumber: classroom || '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    // לוגיקה לשליחה...
    // await incidentHandlers.submitReport(formData, navigate);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-8 md:p-16 text-right text-white font-sans" dir="rtl">
      
      {/* Header Section */}
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-16">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => navigate(-1)} 
            className="w-14 h-14 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all active:scale-90"
          >
            <span className="text-xl">➜</span>
          </button>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Report Incident</h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
              <p className="text-slate-400 font-black text-[15px] uppercase tracking-[0.3em]">בקרת אירועים בזמן אמת • פרוטוקול אבטחה פעיל</p>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex flex-col items-end">
            <span className="text-[15px] font-black text-slate-500 uppercase tracking-widest mb-1">Time of Incident</span>
            <span className="text-2xl font-black font-mono text-rose-500">{formData.time}</span>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[45px] shadow-2xl shadow-black/50 overflow-hidden border border-white/10">
          
          {/* Info Banner */}
          <div className="bg-rose-600 p-8 flex items-center justify-between">
            <p className="text-white font-black text-sm italic uppercase tracking-tight">
              ⚠️ שים לב: דיווח זה מתועד ביומן הבחינה הדיגיטלי ונשלח מיידית למנהל הקומה
            </p>
            <span className="text-rose-200 text-xs font-bold opacity-50 font-mono">CODE: INC-772</span>
          </div>

          <form onSubmit={handleSubmit} className="p-12 md:p-16 space-y-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* מספר חדר */}
              <div className="space-y-3">
                <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest pr-2">מספר חדר / מיקום</label>
                <input 
                  required
                  type="text" 
                  placeholder="לדוגמה: 302"
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-rose-500 focus:bg-white rounded-[22px] py-5 px-8 text-slate-900 font-black transition-all outline-none"
                  onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                />
              </div>

              {/* תעודת זהות סטודנט */}
              <div className="space-y-3">
                <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest pr-2">ת.ז. סטודנט מעורב</label>
                <input 
                  type="text" 
                  placeholder="הזן 9 ספרות"
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-rose-500 focus:bg-white rounded-[22px] py-5 px-8 text-slate-900 font-black transition-all outline-none"
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* סוג אירוע */}
              <div className="space-y-3">
                <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest pr-2">סיווג האירוע</label>
                <div className="relative">
                  <select 
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-rose-500 focus:bg-white rounded-[22px] py-5 px-8 text-slate-900 font-black transition-all outline-none appearance-none cursor-pointer"
                    onChange={(e) => setFormData({...formData, incidentType: e.target.value})}
                  >
                    <option value="">בחר מהרשימה...</option>
                    {incidentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>

              {/* דחיפות */}
              <div className="space-y-3">
                <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest pr-2">רמת חומרה</label>
                <div className="flex gap-3 h-17">
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
                      <div className={`h-full flex items-center justify-center rounded-[20px] bg-slate-100 text-slate-400 font-black text-[15px] uppercase tracking-widest transition-all peer-checked:text-white peer-checked:shadow-lg ${lvl.color}`}>
                        {lvl.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* תיאור האירוע */}
            <div className="space-y-3">
              <label className="text-[15px] font-black text-slate-400 uppercase tracking-widest pr-2">תיאור מפורט של המקרה</label>
              <textarea 
                required
                rows="5"
                placeholder="פרט כאן את מהלך האירוע בצורה אובייקטיבית..."
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-rose-500 focus:bg-white rounded-[30px] py-6 px-8 text-slate-900 font-bold transition-all outline-none resize-none leading-relaxed"
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>

            {/* כפתורי פעולה */}
            <div className="flex flex-col md:flex-row gap-5 pt-6">
              <button 
                type="submit"
                className="flex-2 bg-slate-900 text-white py-6 rounded-[22px] font-black text-sm uppercase tracking-[0.2em] hover:bg-rose-600 transition-all active:scale-[0.98] shadow-2xl shadow-slate-200 flex items-center justify-center gap-4"
              >
                <span>SEND REPORT</span>
                <span className="opacity-30">|</span>
                <span>שליחת דיווח חריג</span>
              </button>
              
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-white border-2 border-slate-100 text-slate-400 py-6 rounded-[22px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <p className="mt-10 text-center text-[15px] font-black text-slate-600 uppercase tracking-[0.4em] opacity-50">
          Digital Incident Logging System • Version 4.0.1 • Authorized Personnel Only
        </p>
      </main>
    </div>
  );
}