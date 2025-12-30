// src/components/layout/DashboardLayout.jsx
import React from 'react';

export default function DashboardLayout({ sidebar, header, children }) {
  return (
    <div className="h-screen flex bg-[#0f172a] overflow-hidden font-sans text-right text-white" dir="rtl">
      {sidebar}
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header with Glassmorphism */}
        <header className="bg-white/5 border-b border-white/10 px-10 py-8 flex justify-between items-center z-30 backdrop-blur-md">
          {header}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-12 bg-[#0f172a] space-y-10">
          {children}
        </main>
      </div>
    </div>
  );
}