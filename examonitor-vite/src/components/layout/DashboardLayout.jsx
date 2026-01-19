// src/components/layout/DashboardLayout.jsx
import React from 'react';
import { useTheme } from '../state/ThemeContext';

export default function DashboardLayout({ sidebar, header, children }) {
  const { isDark } = useTheme();

  return (
    <div 
      className={`h-screen flex transition-colors duration-300 overflow-hidden font-sans text-right ${
        isDark ? 'bg-[#0b1120] text-white' : 'bg-slate-50 text-slate-900'
      }`} 
      dir="rtl"
    >
      {/* Sidebar Panel */}
      {sidebar}
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Header עם Glassmorphism דינמי */}
        <header className={`px-10 py-8 flex justify-between items-center z-30 backdrop-blur-md border-b transition-all duration-300 ${
          isDark 
            ? 'bg-[#0f172a]/80 border-white/5 shadow-2xl shadow-black/20' 
            : 'bg-white/80 border-slate-200 shadow-sm'
        }`}>
          {header}
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto p-12 space-y-10 transition-colors duration-300 ${
          isDark ? 'bg-[#0f172a]/30' : 'bg-slate-50'
        }`}>
          {/* הוספת מעטפת פנימית כדי להבטיח שהתוכן יושב נכון */}
          <div className="max-w-400 mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}