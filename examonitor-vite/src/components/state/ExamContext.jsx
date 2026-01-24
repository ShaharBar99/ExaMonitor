import React, { createContext, useContext, useState, useEffect } from 'react';

const ExamContext = createContext();

export const ExamProvider = ({ children }) => {
  // נתוני המבחן הפעיל - טעינה מ-localStorage
  const [examData, setExamData] = useState(() => {
    const saved = localStorage.getItem('examData');
    return saved ? JSON.parse(saved) : {
      id: null,
      name: '',
      room: '',
      startTime: null,
      duration: 0,
      status: 'pending' // 'active', 'finished', 'paused'
    };
  });

  // שמירה ל-localStorage בכל שינוי
  useEffect(() => {
    localStorage.setItem('examData', JSON.stringify(examData));
  }, [examData]);

  // עדכון סטטוס המבחן (למשל כשהמשגיח לוחץ על "סיום מבחן")
  const updateExamStatus = (newStatus) => {
    setExamData(prev => ({ ...prev, status: newStatus }));
  };

  // פונקציה לאתחול נתוני המבחן (נקרא לה כשנכנסים לדשבורד)
  const loadExam = (data) => {
    setExamData(data);
  };

  // פונקציה לניקוי נתוני המבחן (למשל כשיוצאים מהדשבורד)
  const clearExam = () => {
    setExamData({
      id: null,
      name: '',
      room: '',
      startTime: null,
      duration: 0,
      status: 'pending'
    });
  };

  const value = {
    examData,
    setExamData,
    loadExam,
    updateExamStatus,
    clearExam,
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