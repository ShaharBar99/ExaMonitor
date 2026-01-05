import React from 'react';
import RoomCard from './RoomCard';

// הוספנו את readOnly לרשימת ה-Props שהרכיב מקבל
export default function RoomGrid({ rooms, supervisors, onSupervisorChange, readOnly }) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 opacity-30">
        <span className="text-6xl mb-4">🔍</span>
        <p className="text-xl font-black text-slate-800">לא נמצאו חדרים תואמים</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
      {rooms.map(room => (
        <RoomCard 
          key={room.id} 
          room={room} 
          supervisors={supervisors} 
          onSupervisorChange={onSupervisorChange}
          // חשוב מאוד: מעבירים את ה-readOnly לכל כרטיס בנפרד
          readOnly={readOnly} 
        />
      ))}
    </div>
  );
}