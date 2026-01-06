import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {useAuth} from '../state/AuthContext';
const NavIcon = ({ icon, active, onClick, label, activeColor }) => (
  <button 
    onClick={onClick}
    className={`group relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${
      active 
        ? `${activeColor} text-white shadow-lg scale-110` 
        : 'text-slate-500 hover:text-white hover:bg-slate-800'
    }`}
  >
    <span className="text-xl leading-none">{icon}</span>
    <span className="absolute right-full mr-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-black rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">
      {label}
    </span>
  </button>
);

export default function Sidebar({ 
  tabs = [], 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  setIsSidebarOpen, 
  logoText, 
  logoColor,
  children 
}) {
  const navigate = useNavigate();
  // State to control the confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  let {token, user} = useAuth();  
  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null;
    user = null;
    navigate('/login');
  };

  return (
    <>
      {/* 1. Confirmation Modal (Overlay) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-80 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            
            <h2 className="text-xl font-black text-slate-800 text-center dir-rtl">
              האם אתה בטוח?
            </h2>

            <div className="flex gap-4 w-full">
              <button 
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-colors shadow-lg shadow-red-200"
              >
                כן
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl transition-colors"
              >
                לא
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Sidebar Structure */}
      <div className="flex shrink-0 shadow-2xl z-40 h-screen overflow-hidden bg-[#0f172a]">
        {/* Left Icon Bar */}
        <nav className="w-20 flex flex-col items-center py-8 gap-8 border-l border-slate-800/50">
          <div className={`w-12 h-12 ${logoColor} rounded-2xl flex items-center justify-center text-white font-black text-xl mb-4 shadow-lg shrink-0`}>
            {logoText}
          </div>
          
          <div className="flex flex-col gap-6 flex-1">
            {tabs.map(tab => (
              <NavIcon 
                key={tab.id}
                icon={tab.icon}
                active={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSidebarOpen(true);
                }} 
                label={tab.label}
                activeColor={logoColor}
              />
            ))}
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-3 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </nav>

        {/* Expanding Panel */}
        {isSidebarOpen && (
          <aside className="w-80 bg-white border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300 shadow-inner">
            <div className="p-6 border-b border-slate-50 bg-white/50 backdrop-blur-md flex flex-col gap-1 shrink-0">
              <h2 className={`text-[9px] font-black uppercase tracking-[0.2em] ${logoColor.replace('bg-', 'text-')}`}>
                Exam Management System
              </h2>
              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                {currentTab?.label}
              </h3>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {children}
            </div>

            {/* Bottom Disconnect Button */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => setShowConfirmModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                התנתק
              </button>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}