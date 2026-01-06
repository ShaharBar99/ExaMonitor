// src/components/ui/Buttons.jsx
export const ActionButton = ({ label, icon, onClick, variant = "primary" }) => {
  const styles = {
    primary: "bg-[#0f172a] text-white hover:bg-emerald-600",
    secondary: "bg-slate-100 text-slate-600 hover:bg-slate-200",
    danger: "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white",
    ghost: "border-2 border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
  };

  return (
    <button onClick={onClick} className={`${styles[variant]} px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 border`}>
      {icon && <span className="text-lg">{icon}</span>} {label}
    </button>
  );
};
export const HeaderButton = ({ onClick, variant, label, icon }) => {
  const styles = {
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-[#0f172a]",
    danger: "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white"
  };
  return (
    <button onClick={onClick} className={`${styles[variant]} px-7 py-5 rounded-2xl text-[10px] font-black border transition-all flex items-center gap-3 active:scale-95 uppercase tracking-widest`}>
      <span className="text-xl">{icon}</span> {label}
    </button>
  );
};