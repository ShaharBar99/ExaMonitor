// סימולציה של נתונים מה-DB
const MOCK_EXAMS = [
    { id: '101', courseName: 'מבוא למדעי המחשב', date: '2023-12-28', startTime: '09:00', room: 'אולם 1', type: 'מבחן סמסטר' },
    { id: '102', courseName: 'אלגוריתמים 1', date: '2023-12-29', startTime: '13:00', room: 'מעבדה 402', type: 'בוחן אמצע' },
    { id: '103', courseName: 'מערכות הפעלה', date: '2023-12-30', startTime: '11:00', room: 'אולם 3', type: 'מועד ב' },
];

export const examsApi = {
    // פונקציה להבאת כל המבחנים המשויכים למשתמש
    fetchAssignedExams: async (userId) => {
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_EXAMS), 800); // מדמה השהיית רשת
        });
    }
};
