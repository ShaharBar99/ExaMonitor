import React from 'react';

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
    {/* Tooltip */}
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
  // מוצא את הטאב הנוכחי כדי להציג את השם שלו בכותרת הפאנל
  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="flex shrink-0 shadow-2xl z-40 h-screen overflow-hidden bg-[#0f172a]">
      {/* 1. הבר הצר השמאלי (Icons) */}
      <nav className="w-20 flex flex-col items-center py-8 gap-8 border-l border-slate-800/50">
        {/* Logo */}
        <div className={`w-12 h-12 ${logoColor} rounded-2xl flex items-center justify-center text-white font-black text-xl mb-4  shadow-lg shrink-0`}>
          {logoText}
        </div>
        
        {/* Icons Loop */}
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
        
        {/* Toggle Collapse Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-3 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-xl"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-6 w-6 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </nav>

      {/* 2. הפאנל המתרחב (Children / SidebarPanel) */}
      {isSidebarOpen && (
        <aside className="w-80 bg-white border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300 shadow-inner">
          {/* Header של הפאנל הפתוח */}
          <div className="p-6 border-b border-slate-50 bg-white/50 backdrop-blur-md flex flex-col gap-1 shrink-0">
            <h2 className={`text-[9px] font-black uppercase tracking-[0.2em] ${logoColor.replace('bg-', 'text-')}`}>
              Exam Management System
            </h2>
            <h3 className="text-xl font-black text-slate-800  tracking-tight uppercase">
              {currentTab?.label}
            </h3>
          </div>

          {/* תוכן הטאב (MessageManager / NotificationManager וכו') */}
          <div className="flex-1 overflow-hidden relative">
            {children}
          </div>
        </aside>
      )}
    </div>
  );
}