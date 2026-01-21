// src/layouts/AdminLayout.jsx

import React from "react"; // Import React
import { Outlet } from "react-router-dom"; // Import Outlet for nested routes
import AdminNavbar from "./AdminNavbar"; // Import navbar component
import { useTheme } from "../../state/ThemeContext"; // ייבוא ה-Theme Context

export default function AdminLayout() { // Export AdminLayout component
  const { isDark } = useTheme(); // שימוש במצב ערכת הנושא

  return ( // Return layout UI
    <div className={`min-h-screen transition-colors duration-500 px-4 py-10 ${
      isDark 
        ? "bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white" 
        : "bg-linear-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900"
    }`}> {/* Background covering full height */}
      
      <div className="mx-auto w-full max-w-6xl"> {/* Center container with slightly more width for tables */}
        
        {/* Navbar Wrapper Card */}
        <div className={`mb-8 transition-all duration-300 ${
          isDark 
            ? "shadow-[0_20px_50px_rgba(0,0,0,0.3)]" 
            : "shadow-xl shadow-slate-200/50"
        }`}> 
          <AdminNavbar /> {/* הקומפוננטה עצמה כבר כוללת את העיצוב הפנימי והגבולות */}
        </div> 

        {/* Main Content Area */}
        <main className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Outlet /> {/* Render the active admin page (Tables, Charts, etc.) */}
        </main>

        {/* Optional Footer info */}
        <footer className={`mt-12 text-center text-[10px] font-black uppercase tracking-[0.2em] opacity-40 transition-colors ${
          isDark ? "text-slate-500" : "text-slate-400"
        }`}>
          ExamMonitor Admin Dashboard • v2.0.26
        </footer>
      </div> 
    </div> 
  ); 
}