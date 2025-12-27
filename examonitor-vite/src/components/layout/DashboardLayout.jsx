import React from 'react';

export default function DashboardLayout({ sidebar, header, children }) {
  return (
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden font-sans text-right" dir="rtl">
      {sidebar}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-8 py-6 flex justify-between items-center z-30 shadow-sm">
          {header}
        </header>
        <main className="flex-1 overflow-y-auto p-12 bg-[#f8fafc]">
          {children}
        </main>
      </div>
    </div>
  );
}