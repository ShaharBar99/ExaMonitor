// src/components/admin/AdminNavbar.jsx

import React from "react"; 
import { NavLink, useNavigate } from "react-router-dom"; 
import { useAuth } from "../../state/AuthContext"; 
import { useTheme } from "../../state/ThemeContext"; // ייבוא ה-Theme Context

export default function AdminNavbar() { 
  const navigate = useNavigate(); 
  const { isDark, toggleTheme } = useTheme(); // שימוש ב-Theme
  let { token, user, logout } = useAuth(); // מומלץ להשתמש בפונקציית logout מהקונטקסט אם קיימת

  // הגדרות עיצוב משתנות
  const linkBase = "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95";
  
  const getLinkClass = ({ isActive }) => {
    if (isActive) {
      return `${linkBase} ${isDark ? "bg-white text-slate-900 shadow-lg shadow-white/5" : "bg-slate-900 text-white shadow-md"}`;
    }
    return `${linkBase} ${isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`;
  };

  const onLogout = () => {
    // אם יש פונקציית logout ב-AuthContext כדאי לקרוא לה
    if (logout) {
      logout();
    } else {
      sessionStorage.clear();
      localStorage.clear();
    }
    navigate("/login", { replace: true });
  };

  return ( 
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-2xl border transition-all duration-300 ${
      isDark ? "bg-slate-900/50 border-white/5" : "bg-white border-slate-200 shadow-sm"
    }`}> 
      
      {/* צד ימין - לוגו ומידע */}
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

      {/* צד שמאל - ניווט וכלים */}
      <div className="flex flex-wrap items-center gap-2">
        <nav className="flex items-center gap-1 ml-2">
          <NavLink to="/admin/users" className={getLinkClass}>משתמשים</NavLink>
          <NavLink to="/admin/audit" className={getLinkClass}>Audit</NavLink>
          <NavLink to="/admin/security" className={getLinkClass}>אבטחה</NavLink>
        </nav>

        <div className={`h-6 w-px mx-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />

        {/* כפתור שינוי ערכת נושא */}
        <button 
          onClick={toggleTheme}
          type="button"
          className={`p-2 rounded-xl border transition-all hover:scale-110 ${
            isDark 
              ? "bg-slate-800 border-white/10 text-amber-400" 
              : "bg-white border-slate-200 text-amber-600 shadow-sm"
          }`}
          title={isDark ? "עבור למצב אור" : "עבור למצב לילה"}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* כפתור התנתקות */}
        <button
          type="button"
          onClick={onLogout}
          className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 active:scale-95"
        >
          התנתק
        </button>
      </div> 
    </div> 
  ); 
}