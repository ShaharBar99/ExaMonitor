import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function IncidentReportPage() {
  const navigate = useNavigate();
  
  // State לניהול הטופס
  const [formData, setFormData] = useState({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("דיווח נשלח:", formData);
    // כאן תבוא הלוגיקה של שליחה לשרת/למרצה
    await incidentHandlers.submitReport(formData, navigate);
    navigate(-1); // חזרה לדף הקודם
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12 text-right" dir="rtl">
      
      {/* Header */}
      <header className="max-w-3xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)} 
            className="p-4 bg-white rounded-2xl shadow-sm hover:bg-slate-50 transition-all border border-slate-100"
          >
            <span className="text-indigo-600 font-black">➜</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 italic uppercase">דיווח על אירוע חריג</h1>
            <p className="text-slate-400 font-bold text-xs mt-1 tracking-widest uppercase">תיעוד בזמן אמת - בחינה פעילה</p>
          </div>
        </div>
        <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-black text-xs animate-pulse border border-rose-100">
          LIVE REPORT
        </div>
      </header>

      {/* Form Card */}
      <main className="max-w-3xl mx-auto bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-10 border-b border-slate-50 bg-slate-50/30">
          <p className="text-sm font-bold text-slate-500 leading-relaxed">
            מלא את פרטי האירוע. הדיווח יישלח באופן מיידי למרצה האחראי ולמשגיח הקומה ויתועד ביומן הבחינה הרשמי.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* מספר חדר */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pr-2">מספר חדר</label>
              <input 
                required
                type="text" 
                placeholder="לדוגמה: 302"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl py-4 px-6 font-bold transition-all outline-none"
                onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
              />
            </div>

            {/* תעודת זהות סטודנט */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pr-2">ת.ז. סטודנט (אם רלוונטי)</label>
              <input 
                type="text" 
                placeholder="9 ספרות"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl py-4 px-6 font-bold transition-all outline-none"
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* סוג אירוע */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pr-2">סוג האירוע</label>
              <select 
                required
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl py-4 px-6 font-bold transition-all outline-none appearance-none"
                onChange={(e) => setFormData({...formData, incidentType: e.target.value})}
              >
                <option value="">בחר סוג...</option>
                {incidentTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            {/* דחיפות */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pr-2">רמת דחיפות</label>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFormData({...formData, severity: lvl})}
                    className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${
                      formData.severity === lvl 
                        ? (lvl === 'high' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-slate-800 text-white')
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {lvl === 'low' ? 'רגיל' : lvl === 'medium' ? 'בינוני' : 'דחוף'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* תיאור האירוע */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pr-2">פירוט האירוע</label>
            <textarea 
              required
              rows="4"
              placeholder="תאר בקצרה את השתלשלות האירועים..."
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-3xl py-4 px-6 font-bold transition-all outline-none resize-none"
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          {/* כפתורי פעולה */}
          <div className="flex gap-4 pt-6">
            <button 
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              שליחת דיווח ועדכון גורמים
            </button>
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="px-8 bg-white border-2 border-slate-100 text-slate-400 py-5 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all"
            >
              ביטול
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}