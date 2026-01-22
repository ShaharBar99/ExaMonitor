// src/components/admin/AdminNavbar.jsx

import React from "react"; 
import { NavLink, useNavigate } from "react-router-dom"; 
import { useAuth } from "../../state/AuthContext"; 
import { useTheme } from "../../state/ThemeContext";

export default function AdminNavbar() { 
  const navigate = useNavigate(); 
  const { isDark, toggleTheme } = useTheme(); 
  let { logout } = useAuth(); 

  // Base styling for links
  const linkBase = "px-3 py-2 md:px-4 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 whitespace-nowrap";
  
  const getLinkClass = ({ isActive }) => {
    if (isActive) {
      return `${linkBase} ${isDark ? "bg-white text-slate-900 shadow-lg shadow-white/5" : "bg-slate-900 text-white shadow-md"}`;
    }
    return `${linkBase} ${isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`;
  };

  const onLogout = () => {
    if (logout) logout();
    else {
      sessionStorage.clear();
      localStorage.clear();
    }
    navigate("/login", { replace: true });
  };

  return ( 
    <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-3 md:p-4 rounded-2xl border transition-all duration-300 ${
      isDark ? "bg-slate-900/80 backdrop-blur-md border-white/5" : "bg-white/90 backdrop-blur-md border-slate-200 shadow-sm"
    }`}> 
      
      {/* Top Section: Logo & Theme Toggle (Mobile optimized) */}
      <div className="flex items-center justify-between lg:justify-start gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
            isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-600 text-white border-transparent"
          }`}>
            <span className="font-black text-lg">A</span>
          </div>
          <div className="flex flex-col">
            <div className={`font-black text-sm uppercase tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}>
              Admin Panel
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              מערכת ניהול
            </div>
          </div>
        </div>

        {/* Theme Toggle moved here for mobile to save space in the nav row */}
        <button 
          onClick={toggleTheme}
          type="button"
          className={`lg:hidden p-2.5 rounded-xl border transition-all active:scale-90 ${
            isDark 
              ? "bg-slate-800 border-white/10 text-amber-400" 
              : "bg-slate-50 border-slate-200 text-amber-600"
          }`}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Bottom Section: Navigation Links & Logout */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-2">
        <nav className="flex items-center justify-center sm:justify-start gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <NavLink to="/admin/users" className={getLinkClass}>משתמשים</NavLink>
          <NavLink to="/admin/audit" className={getLinkClass}>Audit</NavLink>
          <NavLink to="/admin/security" className={getLinkClass}>אבטחה</NavLink>
        </nav>

        {/* Separator - Hidden on small mobile */}
        <div className={`hidden sm:block h-6 w-px mx-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

        <div className="flex items-center gap-2">
          {/* Theme Toggle for Desktop */}
          <button 
            onClick={toggleTheme}
            type="button"
            className={`hidden lg:block p-2 rounded-xl border transition-all hover:scale-110 ${
              isDark 
                ? "bg-slate-800 border-white/10 text-amber-400" 
                : "bg-white border-slate-200 text-amber-600 shadow-sm"
            }`}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Logout Button - Full width on smallest screens */}
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 active:scale-95"
          >
            התנתק
          </button>
        </div>
      </div> 
    </div> 
  ); 
}