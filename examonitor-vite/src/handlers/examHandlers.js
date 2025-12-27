export const examHandlers = {
    // פונקציית סינון המבחנים לפי טקסט חופשי
    filterExams: (exams, query) => {
        try {
            // הגנה למקרה ש-exams אינו מערך או שאין שאילתה
            if (!Array.isArray(exams)) return [];
            if (!query || typeof query !== 'string') return exams;

            const lowerQuery = query.toLowerCase();

            return exams.filter(exam => {
                // שימוש ב-Optional Chaining (?.) למקרה ששדות חסרים באובייקט
                return (
                    exam.courseName?.toLowerCase().includes(lowerQuery) || 
                    exam.id?.toString().includes(lowerQuery) ||
                    exam.room?.toLowerCase().includes(lowerQuery)
                );
            });
        } catch (error) {
            console.error("Error filtering exams:", error);
            return []; // מחזירים מערך ריק כדי שה-UI לא יישבר
        }
    },

    // לוגיקת בחירת מבחן ומעבר לדף הבא
    handleSelectExam: (examId, navigate) => {
        try {
            if (!examId) {
                throw new Error("Exam ID is missing");
            }
            if (!navigate) {
                throw new Error("Navigation function is missing");
            }

            console.log(`Navigating to exam: ${examId}`);
            navigate(`/exam-console/${examId}`);
        } catch (error) {
            console.error("Navigation failed:", error);
            alert("חלה שגיאה במעבר לדף המבחן. נא לנסות שוב.");
        }
    }
};