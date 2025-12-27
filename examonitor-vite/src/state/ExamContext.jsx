import React, { createContext, useContext, useState } from 'react';

const ExamContext = createContext();

export const ExamProvider = ({ children }) => {
  // נתוני המבחן הפעיל
  const [examData, setExamData] = useState({
    id: null,
    name: '',
    room: '',
    startTime: null,
    duration: 0,
    status: 'pending' // 'active', 'finished', 'paused'
  });

  // עדכון סטטוס המבחן (למשל כשהמשגיח לוחץ על "סיום מבחן")
  const updateExamStatus = (newStatus) => {
    setExamData(prev => ({ ...prev, status: newStatus }));
  };

  // פונקציה לאתחול נתוני המבחן (נקרא לה כשנכנסים לדשבורד)
  const loadExam = (data) => {
    setExamData(data);
  };

  const value = {
    examData,
    setExamData,
    loadExam,
    updateExamStatus,
    examId: examData.id // קיצור דרך נוח
  };

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};