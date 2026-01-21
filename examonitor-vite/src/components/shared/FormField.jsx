// src/components/shared/FormField.jsx

import React from "react";

export default function FormField({
  id, name, type = "text", label, placeholder, value,
  onChange, error, disabled = false, autoComplete, isDark = false,
}) {
  return (
    <div className="mb-4">
      <label className={`block text-xs font-black uppercase tracking-widest mb-1.5 mr-1 transition-colors ${
        isDark ? "text-slate-400" : "text-slate-600"
      }`} htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        name={name || id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none text-sm font-bold placeholder-ultra-light ${
          isDark 
            ? "bg-slate-800 border-white/5 text-white focus:border-blue-500/50" 
            : "bg-white border-slate-200 text-slate-900 focus:border-blue-500"
        } disabled:opacity-60`}
        placeholder={placeholder}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        /* Autofill - מונע רקע צהוב */
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px ${isDark ? "#1e293b" : "white"} inset !important;
          -webkit-text-fill-color: ${isDark ? "white" : "#0f172a"} !important;
        }

        /* Placeholder - שקיפות נמוכה מאוד (0.15) */
        .placeholder-ultra-light::placeholder {
          color: ${isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(15, 23, 42, 0.4)"} !important;
          opacity: 1 !important;
          font-weight: 400 !important;
        }
      `}} />

      {error && <p className="mt-1.5 text-[11px] font-bold text-red-500 mr-1">{error}</p>}
    </div>
  );
}