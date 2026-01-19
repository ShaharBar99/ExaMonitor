// src/components/ui/Buttons.jsx

export const ActionButton = ({ label, icon, onClick, variant = "primary", isDark = false }) => {
  const styles = {
    // ב-Light Mode כפתור ה-Primary הוא כהה מאוד, ב-Dark Mode הוא הופך ללבן (ניגודיות הפוכה)
    primary: isDark 
      ? "bg-white text-slate-900 hover:bg-emerald-400 border-transparent" 
      : "bg-[#0f172a] text-white hover:bg-emerald-600 border-transparent",
    
    secondary: isDark
      ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border-white/5"
      : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200",
    
    danger: isDark
      ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-600 hover:text-white"
      : "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white",
    
    ghost: isDark
      ? "border-white/10 text-slate-400 hover:border-white/20 hover:text-white bg-transparent"
      : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 bg-transparent"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${styles[variant]} px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 border shadow-sm`}
    >
      {icon && <span className="text-lg">{icon}</span>} {label}
    </button>
  );
};

export const HeaderButton = ({ onClick, variant, label, icon, isDark = false }) => {
  const styles = {
    warning: isDark
      ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-[#0f172a]"
      : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-500 hover:text-white",
    
    danger: isDark
      ? "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white"
      : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${styles[variant]} px-7 py-5 rounded-2xl text-[10px] font-black border transition-all flex items-center gap-3 active:scale-95 uppercase tracking-widest shadow-sm`}
    >
      <span className="text-xl">{icon}</span> {label}
    </button>
  );
};