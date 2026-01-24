import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useTheme } from '../state/ThemeContext';
// רכיב האייקון בסרגל הצדי
const NavIcon = ({ icon, active, onClick, label, activeColor, isDark }) => (
  <button 
    onClick={onClick}
    className={`group relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${
      active 
        ? `${activeColor} text-white shadow-lg scale-110` 
        : isDark 
          ? 'text-slate-500 hover:text-white hover:bg-slate-800' 
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
    }`}
  >
    <span className="text-xl leading-none">{icon}</span>
    <span className={`hidden md:block absolute right-full mr-4 px-2 py-1 text-[10px] font-black rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border transition-opacity ${
      isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-800 border-slate-200'
    }`}>
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
  const { isDark, toggleTheme } = useTheme();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { user } = useAuth();
  
  // הגדרת רוחב ראשונית חכמה
  const getInitialWidth = () => {
    if (window.innerWidth < 768) return window.innerWidth - 80; // 80px זה רוחב ה-Nav
    return 350;
  };

  const [sidebarWidth, setSidebarWidth] = useState(getInitialWidth());
  const isResizing = useRef(false);

  // לוגיקה לזיהוי Swipe לסגירה במובייל
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isSwipeToClose = distance < -minSwipeDistance; 
    if (isSidebarOpen && isSwipeToClose) {
      setIsSidebarOpen(false);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // עדכון רוחב בחלון משתנה עם דגש על מובייל
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarWidth(window.innerWidth - 80);
      } else {
        // אם חזרנו לדסקטופ והרוחב היה של מובייל, נחזיר לדיפולט
        if (sidebarWidth > window.innerWidth - 80 || sidebarWidth < 280) {
          setSidebarWidth(450);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarWidth]);

  // לוגיקה לשינוי רוחב ידני (Desktop)
  const startResizing = useCallback((e) => {
    if (window.innerWidth < 768) return;
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    // החישוב מתחשב במיקום העכבר ביחס לצד ימין (RTL) פחות רוחב ה-Nav
    const newWidth = window.innerWidth - e.clientX - 80;
    if (newWidth > 280 && newWidth < 800) {
      setSidebarWidth(newWidth);
    }
  }, []);

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className={`p-8 rounded-[40px] shadow-2xl w-full max-w-sm flex flex-col items-center gap-6 border transition-all animate-in zoom-in-95 ${
            isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'
          }`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-red-500 font-bold text-4xl italic ${
              isDark ? 'bg-red-500/10' : 'bg-red-50'
            }`}>!</div>
            <h2 className={`text-2xl font-black text-center ${isDark ? 'text-white' : 'text-slate-800'}`}>האם להתנתק?</h2>
            <div className="flex gap-4 w-full mt-2">
              <button onClick={handleLogout} className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95">כן</button>
              <button onClick={() => setShowConfirmModal(false)} className={`flex-1 py-4 font-black rounded-2xl transition-all ${
                isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>לא</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Sidebar Container */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          fixed inset-y-0 right-0 z-40 flex shrink-0 shadow-2xl transition-all duration-300
          md:relative md:h-screen ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          ${isDark ? 'bg-[#0f172a]' : 'bg-white'}
          overflow-hidden
        `}
      >
        
        {/* Right Icon Bar (Nav) */}
        <nav className={`w-16 sm:w-20 flex flex-col items-center py-6 sm:py-8 gap-6 border-l transition-colors z-50 shrink-0 ${
          isDark ? 'border-slate-800/50 bg-[#0f172a]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className={`w-10 h-10 sm:w-12 sm:h-12 ${logoColor} rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl mb-4 shadow-lg shrink-0 uppercase`}>
            {logoText?.charAt(0)}
          </div>
          
          <div className="flex flex-col gap-5 flex-1 items-center">
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
                isDark={isDark}
              />
            ))}
          </div>

          <div className="flex flex-col gap-4 items-center mb-4 shrink-0">
            <button 
              onClick={toggleTheme}
              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all text-xl shadow-inner ${
                isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className={`p-3 transition-all rounded-xl active:scale-90 ${
                isDark ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-500 ${isSidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Dynamic Expanding Content Panel */}
        {isSidebarOpen && (
          <aside 
            style={{ 
              width: window.innerWidth < 768 ? `${window.innerWidth - 64}px` : `${sidebarWidth}px`,
              maxWidth: 'calc(100vw - 64px)'
            }}
            className={`
              flex flex-col relative animate-in slide-in-from-right duration-300 shadow-inner transition-colors
              ${isDark ? 'bg-slate-900' : 'bg-white'}
              min-w-0 overflow-hidden shrink-0
            `}
          >
            {/* Resizer Handle - Desktop only */}
            <div 
              onMouseDown={startResizing}
              className="hidden md:block absolute left-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-emerald-500/30 transition-colors z-50 group"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 rounded-full opacity-0 group-hover:opacity-100 transition-all bg-emerald-500"></div>
            </div>

            {/* Panel Header */}
            <div className={`p-5 sm:p-8 border-b-2 backdrop-blur-md flex flex-col gap-1 shrink-0 transition-colors ${
              isDark ? 'border-white/5 bg-slate-900/50' : 'border-slate-50 bg-white/50'
            }`}>
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <h2 className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] truncate ${logoColor.replace('bg-', 'text-')}`}>
                    Exam System
                  </h2>
                  <h3 className={`text-xl sm:text-3xl font-black tracking-tight uppercase italic truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {currentTab?.label}
                  </h3>
                </div>
                {/* Mobile Close Button */}
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-500 text-xl hover:text-red-500 transition-colors">✕</button>
              </div>
            </div>

            {/* Content Area - המקום של הבוט */}
            <div className="flex-1 min-w-0 overflow-hidden relative flex flex-col">
              {children}
            </div>

            {/* Footer Logout Button */}
            <div className={`p-4 sm:p-6 border-t-2 shrink-0 transition-colors ${
              isDark ? 'border-white/5 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <button 
                onClick={() => setShowConfirmModal(true)}
                className={`w-full flex items-center justify-center gap-3 sm:gap-4 py-4 sm:py-6 px-4 font-black text-lg sm:text-xl uppercase tracking-widest rounded-2xl sm:rounded-3xl transition-all duration-200 shadow-md active:scale-95 border-2 ${
                  isDark 
                    ? 'bg-slate-800 border-white/10 text-slate-300 hover:text-red-500 hover:border-red-900/30' 
                    : 'bg-white border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="truncate">התנתקות</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-[2px] z-30 animate-in fade-in duration-300"
        />
      )}
    </>
  );
}