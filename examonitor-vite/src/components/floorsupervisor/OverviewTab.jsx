import React from 'react';

const QuickActionCard = ({ title, value, desc, icon, color = "text-white", onClick, isDark }) => (
  <button 
    onClick={onClick}
    className={`rounded-[30px] md:rounded-[45px] p-6 md:p-12 border transition-all text-right group relative overflow-hidden w-full shadow-xl md:shadow-2xl ${
      isDark 
        ? 'bg-white/5 border-white/10 hover:bg-white/10 shadow-none' 
        : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-indigo-500/10'
    }`}
  >
    <div className="relative z-10">
      <p className={`text-[10px] md:text-sm font-black uppercase tracking-widest mb-1 md:mb-2 ${
        isDark ? 'text-slate-400' : 'text-slate-500'
      }`}>
        {title}
      </p>
      <h3 className={`text-3xl md:text-5xl font-black tracking-tighter mb-2 md:mb-4 ${
        isDark ? color : (color === 'text-white' ? 'text-slate-900' : color)
      }`}>
        {value}
      </h3>
      <p className={`font-bold text-[10px] md:text-sm uppercase opacity-60 ${
        isDark ? 'text-slate-500' : 'text-slate-400'
      }`}>
        {desc}
      </p>
    </div>
    
    {/* האייקון הגדול ברקע */}
    <span className={`absolute -left-4 -bottom-4 text-7xl md:text-9xl transition-transform duration-500 group-hover:scale-110 ${
      isDark ? 'opacity-5 text-white' : 'opacity-[0.03] text-slate-900'
    }`}>
      {icon}
    </span>
  </button>
);

export default function OverviewTab({ stats, onNavigate, isDark }) {
    // וידוא נתונים
    const totalStudents = stats?.totalStudents || 0;
    const warnings = stats?.warnings || 0;

    return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-10 animate-in fade-in duration-500">
      <QuickActionCard 
        isDark={isDark}
        title="סטטוס נוכחות" 
        value={`${totalStudents} סטודנטים`} 
        desc="צפה בפריסת החדרים המלאה" 
        icon="👨‍🎓" 
        onClick={() => onNavigate('rooms')}
      />
      
      <QuickActionCard 
        isDark={isDark}
        title="התראות חריגות" 
        value={`${warnings} אירועים`} 
        desc="עבור ליומן האירועים המפורט" 
        icon="⚠️" 
        color="text-rose-500"
        onClick={() => onNavigate('logs')}
      />
    </div>
  );
}