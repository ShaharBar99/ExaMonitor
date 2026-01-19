import { useTheme } from '../state/ThemeContext';

const StatCard = ({ label, value, variant = "default", progress, highlight, icon }) => {
  const { isDark } = useTheme();

  // הגדרת ערכות נושא - שיפור ניגודיות ב-Light Mode
  const themes = {
    default: isDark 
      ? 'text-white border-white/10 bg-white/5' 
      : 'text-slate-900 border-slate-200 bg-white shadow-md',
    
    success: isDark 
      ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' 
      : 'text-emerald-800 border-emerald-200 bg-emerald-50 shadow-sm', // כהה יותר ב-Light
    
    info: isDark 
      ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' 
      : 'text-blue-800 border-blue-200 bg-blue-50 shadow-sm', // כהה יותר ב-Light
    
    warning: isDark 
      ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' 
      : 'text-amber-800 border-amber-200 bg-amber-50 shadow-sm', // כהה יותר ב-Light

    dark: 'text-white border-white/10 bg-slate-800'
  };

  return (
    <div className={`${themes[variant]} p-8 rounded-[40px] border-2 transition-all hover:scale-[1.02] relative overflow-hidden group text-right`}>
      
      <div className="flex justify-between items-start mb-4">
        {/* שינוי כאן: העלאת ה-Opacity והפיכת הטקסט לכהה יותר ב-Light Mode */}
        <p className={`text-[13px] font-black uppercase tracking-[0.15em] transition-all ${
          isDark 
            ? 'opacity-60 text-white' 
            : 'opacity-100 text-slate-600' // ב-Light Mode אנחנו רוצים 100% נראות של צבע אפור כהה
        }`}>
          {label}
        </p>
        <span className={`text-2xl transition-all duration-300 ${
          isDark ? 'opacity-30 group-hover:opacity-100' : 'opacity-60 group-hover:scale-110'
        }`}>
          {icon}
        </span>
      </div>

      <div className="flex items-baseline gap-3 relative z-10">
        <p className={`text-6xl font-black tabular-nums leading-none tracking-tight ${
          highlight ? 'animate-pulse' : ''
        } ${!isDark ? 'text-slate-900' : ''}`}>
          {value}
        </p>
        
        {progress !== undefined && (
          <span className={`text-sm font-bold opacity-60 leading-none ${!isDark ? 'text-slate-500' : ''}`}>
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className={`absolute bottom-0 left-0 w-full h-2 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
          <div 
            className="h-full bg-current transition-all duration-1000 opacity-40" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {!isDark && (
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-current opacity-[0.04] rounded-full blur-2xl pointer-events-none"></div>
      )}
    </div>
  );
};

export default StatCard;