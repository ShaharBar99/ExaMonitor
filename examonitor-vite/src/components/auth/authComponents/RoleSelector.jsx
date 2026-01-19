// src/components/auth/RoleSelector.jsx

import React, { useMemo } from "react"; 
import { normalizeRole, ROLE_OPTIONS } from "../../../handlers/authHandlers"; 

export default function RoleSelector({ value, onChange, disabled, isRegister=false, isDark=false }) { 
  const selectedRole = normalizeRole(value); 
  
  const roles = useMemo(() => {
    if (isRegister) {
      return ROLE_OPTIONS.filter(r => r.value !== 'admin' && r.value !== 'SYSTEM_ADMIN'); 
    }
    return ROLE_OPTIONS;
  }, [isRegister]);

  const baseClass = useMemo(() => { 
    return "role-btn px-3 py-2 rounded-xl border-2 text-xs font-black uppercase tracking-tight transition-all duration-300"; 
  }, []); 

  const getButtonClass = (btnRole) => { 
    const normalizedBtnRole = normalizeRole(btnRole); 
    const isSelected = normalizedBtnRole === selectedRole;

    if (isDark) {
      // מצב Dark Mode
      return isSelected 
        ? `${baseClass} border-blue-500 bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]` 
        : `${baseClass} border-white/5 bg-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10`;
    } else {
      // מצב Light Mode
      return isSelected 
        ? `${baseClass} border-blue-600 bg-blue-50 text-blue-700 shadow-sm` 
        : `${baseClass} border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50`;
    }
  }; 

  const handleClick = (role) => { 
    if (disabled) return; 
    if (typeof onChange === "function") onChange(normalizeRole(role)); 
  }; 

  return ( 
    <div className="mb-4 text-right"> 
      <label className={`block text-[11px] font-black uppercase tracking-widest mb-2 mr-1 ${
        isDark ? "text-slate-500" : "text-slate-600"
      }`}>
        בחר תפקיד במערכת
      </label> 
      
      <div className="grid grid-cols-2 gap-2" id="role-toggle"> 
        {roles.map((r) => ( 
          <button
            key={r.value} 
            type="button" 
            className={getButtonClass(r.value)} 
            onClick={() => handleClick(r.value)} 
            disabled={disabled}
          >
            {r.label}
          </button> 
        ))} 
      </div> 
      
      <p className={`text-[10px] font-bold mt-2 mr-1 uppercase tracking-tight ${
        isDark ? "text-slate-600" : "text-slate-400"
      }`}>
        ההרשאות והמסכים יותאמו לפי תפקידך
      </p> 
    </div> 
  ); 
}