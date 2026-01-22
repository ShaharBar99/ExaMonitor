// src/components/layout/DashboardLayout.jsx
import React from 'react';
import { useTheme } from '../state/ThemeContext';

export default function DashboardLayout({ sidebar, header, children}) {
  const { isDark } = useTheme();

  return (
    <div 
      className={`h-screen flex transition-colors duration-300 overflow-hidden font-sans text-right ${
        isDark ? 'bg-[#0b1120] text-white' : 'bg-slate-50 text-slate-900'
      }`} 
      dir="rtl"
    >
      {/* Sidebar Panel 
          Note: Your Sidebar component likely handles its own 'fixed' or 'relative' 
          positioning based on isSidebarOpen.
      */}
      {sidebar}
      
      <div className="flex-1 flex flex-col overflow-hidden relative w-full">
        
       {/* Header - הוספנו כאן את כפתור הפתיחה למובייל */}
        <header className={`px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8 flex justify-between items-center z-30 backdrop-blur-md border-b transition-all duration-300 ${
          isDark 
            ? 'bg-[#0f172a]/80 border-white/5 shadow-2xl shadow-black/20' 
            : 'bg-white/80 border-slate-200 shadow-sm'
        }`}>
          
          <div className="flex items-center gap-4">
            {/* התוכן המקורי של ה-Header (כותרת, סטטיסטיקות וכו') */}
            {header}
          </div>
        </header>

        {/* Main Content Area - Responsive Spacing */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-12 transition-colors duration-300 ${
          isDark ? 'bg-[#0f172a]/30' : 'bg-slate-50'
        }`}>
          {/* Inner wrapper with max-width for ultra-wide monitors and full-width for mobile */}
          <div className="max-w-400 mx-auto w-full space-y-6 sm:space-y-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}