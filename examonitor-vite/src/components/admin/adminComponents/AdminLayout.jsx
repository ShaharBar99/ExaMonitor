// src/layouts/AdminLayout.jsx

import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import { useTheme } from "../../state/ThemeContext";

/**
 * Layout wrapper for admin pages.
 */
export default function AdminLayout() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-500 overflow-x-hidden ${
      isDark 
        ? "bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white" 
        : "bg-linear-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900"
    }`}>
      
      {/* Container behavior:
          - Mobile: px-4 (standard), py-6 (tighter top spacing)
          - Desktop: px-6, py-10
      */}
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10 lg:py-12">
        
        {/* Navbar Wrapper Card - Sticky on mobile for easier navigation */}
        <div className={`mb-6 md:mb-10 sticky top-0 md:relative z-50 transition-all duration-300 ${
          isDark 
            ? "shadow-[0_20px_50px_rgba(0,0,0,0.3)]" 
            : "shadow-xl shadow-slate-200/50"
        }`}> 
          <AdminNavbar />
        </div> 

        {/* Main Content Area */}
        <main className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Outlet />
        </main>

        {/* Footer info: Hides extra info on very small screens to keep UI clean */}
        <footer className={`mt-10 md:mt-16 text-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] opacity-40 transition-colors ${
          isDark ? "text-slate-500" : "text-slate-400"
        }`}>
          <div className="flex flex-col md:flex-row justify-center items-center gap-1 md:gap-3">
            <span>ExamMonitor Admin Dashboard</span>
            <span className="hidden md:inline">•</span>
            <span>v2.0.26</span>
          </div>
          <p className="mt-2 block md:hidden">System Secured • 2026</p>
        </footer>
      </div> 
    </div> 
  ); 
}