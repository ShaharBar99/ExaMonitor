import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

const NavIcon = ({ icon, active, onClick, label, activeColor }) => (
  <button 
    onClick={onClick}
    className={`group relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${
      active 
        ? `${activeColor} text-white shadow-lg scale-110` 
        : 'text-slate-500 hover:text-white hover:bg-slate-800'
    }`}
  >
    <span className="text-xl leading-none">{icon}</span>
    <span className="absolute right-full mr-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-black rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">
      {label}
    </span>
  </button>
);

export default function Sidebar({ 
  tabs = [], 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  setIsSidebarOpen, 
  logoText, 
  logoColor,
  children 
}) {
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { token, user, logout } = useAuth(); // שימוש ב-logout מה-Context אם קיים
  
  // --- לוגיקת Resize ---
  const [sidebarWidth, setSidebarWidth] = useState(450); // רוחב התחלתי מוגדל (במקום 320)
  const isResizing = useRef(false);

  const startResizing = useCallback((e) => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize"; // שינוי הסמן בכל המסך בזמן גרירה
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    
    // חישוב הרוחב (מכיוון שאנחנו ב-RTL והסיידבר בימין, החישוב הפוך)
    const newWidth = window.innerWidth - e.clientX - 80; // 80 זה רוחב ה-Icon Bar
    
    // הגבלת מינימום ומקסימום לרוחב
    if (newWidth > 280 && newWidth < 600) {
      setSidebarWidth(newWidth);
    }
  }, []);

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-80 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2 font-bold text-3xl italic">!</div>
            <h2 className="text-2xl font-black text-slate-800 text-center">האם אתה בטוח?</h2>
            <div className="flex gap-4 w-full">
              <button onClick={handleLogout} className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all shadow-lg">כן</button>
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl transition-all">לא</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex shrink-0 shadow-2xl z-40 h-screen overflow-hidden bg-[#0f172a]">
        
        {/* Left Icon Bar (קבוע ב-80px) */}
        <nav className="w-20 flex flex-col items-center py-8 gap-8 border-l border-slate-800/50">
          <div className={`w-12 h-12 ${logoColor} rounded-2xl flex items-center justify-center text-white font-black text-xl mb-4 shadow-lg shrink-0 uppercase`}>
            {logoText}
          </div>
          <div className="flex flex-col gap-6 flex-1">
            {tabs.map(tab => (
              <NavIcon 
                key={tab.id}
                icon={tab.icon}
                active={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSidebarOpen(true);
                }} 
                label={tab.label}
                activeColor={logoColor}
              />
            ))}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-3 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </nav>

        {/* Expanding Panel with Resize Ability */}
        {isSidebarOpen && (
          <aside 
            style={{ width: `${sidebarWidth}px` }}
            className="bg-white border-l border-slate-100 flex flex-col relative animate-in slide-in-from-right duration-300 shadow-inner"
          >
            {/* Resizer Handle - פס דק שניתן לגרור */}
            <div 
              onMouseDown={startResizing}
              className="absolute left-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-emerald-500/30 transition-colors z-50 group"
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-slate-200 rounded-full group-hover:bg-emerald-500 opacity-0 group-hover:opacity-100 transition-all"></div>
            </div>

            <div className="p-8 border-b-2 border-slate-50 bg-white/50 backdrop-blur-md flex flex-col gap-1 shrink-0">
              <h2 className={`text-[11px] font-black uppercase tracking-[0.2em] ${logoColor.replace('bg-', 'text-')}`}>
                Exam Management System
              </h2>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic">
                {currentTab?.label}
              </h3>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {children}
            </div>

            <div className="p-6 border-t-2 border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => setShowConfirmModal(true)}
                className="w-full flex items-center justify-center gap-4 py-6 px-4 bg-white border-2 border-slate-200 text-slate-600 font-black text-2xl uppercase tracking-widest rounded-3xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200 shadow-md hover:shadow-xl active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                התנתק מהמערכת
              </button>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}