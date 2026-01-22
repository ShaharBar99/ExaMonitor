import React from 'react';
import RoomCard from './RoomCard';

export default function RoomGrid({ rooms, supervisors, onSupervisorChange, readOnly, isDark }) {
  if (!rooms || rooms.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 text-center ${
        isDark ? 'opacity-20' : 'opacity-30'
      }`}>
        <span className="text-5xl md:text-6xl mb-4">🔍</span>
        <p className={`text-lg md:text-xl font-black uppercase tracking-tight ${
          isDark ? 'text-white' : 'text-slate-800'
        }`}>
          לא נמצאו חדרים תואמים
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8 pb-12">
      {rooms.map(room => (
        <RoomCard 
          key={room.id} 
          room={room} 
          supervisors={supervisors} 
          onSupervisorChange={onSupervisorChange}
          readOnly={readOnly} 
          isDark={isDark}
        />
      ))}
    </div>
  );
}