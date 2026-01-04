const StatCard = ({ label, value, variant = "default", progress, highlight, icon }) => {
  const themes = { 
    default: 'text-white border-white/10 bg-white/5', 
    success: 'text-emerald-500 border-emerald-500/10 bg-emerald-500/5', 
    info: 'text-blue-400 border-blue-400/10 bg-blue-400/5', 
    warning: 'text-amber-500 border-amber-500/10 bg-amber-500/5' 
  };

  return (
    <div className={`${themes[variant]} p-8 rounded-[40px] border-2 transition-all hover:scale-[1.02] relative overflow-hidden group shadow-lg text-right`}>
      <div className="flex justify-between items-start mb-3">
        <p className="text-[14px] font-black opacity-60 uppercase tracking-[0.2em]">{label}</p>
        <span className="text-xl opacity-30 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      <div className="flex items-baseline gap-3">
        <p className={`text-5xl font-black  tabular-nums leading-none ${highlight ? 'animate-pulse' : ''}`}>{value}</p>
        {progress !== undefined && <span className="text-[11px] font-bold opacity-30  leading-none">{Math.round(progress)}%</span>}
      </div>
      {progress !== undefined && (
        <div className="absolute bottom-0 left-0 w-full h-2 bg-white/5">
          <div className="h-full bg-current transition-all duration-1000 opacity-50" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
};

export default StatCard;