import React from 'react';

const SelectExamPage = ({ navigate }) => {
  // נתונים זמניים להצגה
  const exams = [
    { id: '101', name: 'מבוא למחשבים', room: 'אולם 1' },
    { id: '202', name: 'מבני נתונים', room: 'מעבדה 3' }
  ];

  return (
    <div className="p-10 text-right" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">בחר מבחן לניהול</h1>
      <div className="grid gap-4">
        {exams.map(exam => (
          <div key={exam.id} className="p-4 border rounded shadow hover:bg-gray-50 flex justify-between items-center">
            <div>
              <p className="font-bold">{exam.name}</p>
              <p className="text-sm text-gray-500">{exam.room}</p>
            </div>
            <button 
              onClick={() => navigate(`/exam/active/${exam.id}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              כניסה למבחן
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectExamPage;