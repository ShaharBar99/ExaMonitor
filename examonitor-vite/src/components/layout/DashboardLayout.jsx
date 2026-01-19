// src/components/layout/DashboardLayout.jsx
import React from 'react';
import { useTheme } from '../state/ThemeContext'; // We still need the state

export default function DashboardLayout({ sidebar, header, children }) {
  const { isDark } = useTheme();

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-[#0f172a] transition-colors duration-300 overflow-hidden font-sans text-right text-slate-900 dark:text-white" dir="rtl">
      {sidebar}
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header with Glassmorphism - Light: bg-white/80, Dark: bg-white/5 */}
        <header className="bg-white/80 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 px-10 py-8 flex justify-between items-center z-30 backdrop-blur-md">
          {header}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-12 bg-slate-50 dark:bg-[#0f172a] space-y-10 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}