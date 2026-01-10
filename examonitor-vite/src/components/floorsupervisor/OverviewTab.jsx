import React from 'react';

const QuickActionCard = ({ title, value, desc, icon, color = "text-white", onClick }) => (
  <button 
    onClick={onClick}
    className="bg-white/5 rounded-[45px] p-12 border border-white/10 hover:bg-white/10 transition-all text-right group relative overflow-hidden w-full"
  >
    <div className="relative z-10">
      <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
      <h3 className={`text-5xl font-black tracking-tighter mb-4 ${color}`}>{value}</h3>
      <p className="text-slate-500 font-bold text-sm uppercase opacity-60">{desc}</p>
    </div>
    <span className="absolute -left-4 -bottom-4 text-9xl opacity-5 group-hover:scale-110 transition-transform duration-500">{icon}</span>
  </button>
);

export default function OverviewTab({ stats, onNavigate }) {
    stats = stats || { totalStudents: 0, warnings: 0 };
    return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-500">
      <QuickActionCard 
        title="סטטוס נוכחות" 
        value={`${stats.totalStudents} סטודנטים`} 
        desc="צפה בפריסת החדרים המלאה" 
        icon="👨‍🎓" 
        onClick={() => onNavigate('rooms')}
      />
      <QuickActionCard 
        title="התראות חריגות" 
        value={`${stats.warnings} אירועים`} 
        desc="עבור ליומן האירועים המפורט" 
        icon="⚠️" 
        color="text-rose-500"
        onClick={() => onNavigate('logs')}
      />
    </div>
  );
}