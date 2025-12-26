export const examHandlers = {
    // פונקציית סינון המבחנים לפי טקסט חופשי
    filterExams: (exams, query) => {
        if (!query) return exams;
        return exams.filter(exam => 
            exam.courseName.includes(query) || 
            exam.id.includes(query) ||
            exam.room.includes(query)
        );
    },

    // לוגיקת בחירת מבחן ומעבר לדף הבא
    handleSelectExam: (examId, navigate) => {
        console.log(`Navigating to exam: ${examId}`);
        // כאן נשתמש ב-React Router כדי לעבור לדף ה-Console
        navigate(`/exam-console/${examId}`);
    }
};