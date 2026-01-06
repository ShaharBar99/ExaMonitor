import { examsApi } from '../api/examsApi';

export const examHandlers = {
    // פונקציית סינון המבחנים לפי טקסט חופשי
    filterExams: (exams, query) => {
        try {
            if (!Array.isArray(exams)) return [];
            if (!query || typeof query !== 'string') return exams;

            const lowerQuery = query.toLowerCase();

            return exams.filter(exam => {
                return (
                    exam.courseName?.toLowerCase().includes(lowerQuery) || 
                    exam.id?.toString().includes(lowerQuery) ||
                    exam.room?.toLowerCase().includes(lowerQuery)
                );
            });
        } catch (error) {
            console.error("Error filtering exams:", error);
            return [];
        }
    },

    // לוגיקת בחירת מבחן ומעבר לדף הבא
    handleSelectExam: (examId, navigate) => {
        try {
            if (!examId || !navigate) throw new Error("Missing parameters for navigation");
            console.log(`Navigating to exam: ${examId}`);
            navigate(`/exam-console/${examId}`);
        } catch (error) {
            console.error("Navigation failed:", error);
            alert("חלה שגיאה במעבר לדף המבחן.");
        }
    },

    // שליחת הודעה גלובלית (Broadcast) לכל הכיתות
    handleBroadcast: async (examId) => {
        try {
            const message = prompt("הקלד את ההודעה להפצה לכל הכיתות:");
            if (!message || !message.trim()) return;

            const response = await examsApi.broadcastAnnouncement(examId, message);
            if (response.success) {
                alert("ההודעה הופצה בהצלחה לכל המשגיחים והסטודנטים.");
            }
        } catch (error) {
            console.error("Broadcast failed:", error);
            alert("שגיאה בהפצת ההודעה.");
        }
    },

    // ניהול שינוי סטטוס המבחן (עצירה/חידוש/סיום)
    handleChangeStatus: async (examId, newStatus, setExamData) => {
        try {
            const confirmMsg = newStatus === 'ended' ? "האם אתה בטוח שברצונך לסיים את המבחן? לא ניתן לבטל פעולה זו." : `האם לשנות את סטטוס המבחן ל-${newStatus}?`;
            if (!window.confirm(confirmMsg)) return;

            const response = await examsApi.updateExamStatus(examId, newStatus);
            if (response.success) {
                // עדכון ה-State המקומי אם פונקציית העדכון סופקה
                if (setExamData) {
                    setExamData(prev => ({ ...prev, status: newStatus }));
                }
                alert(`סטטוס המבחן עודכן ל-${newStatus}`);
            }
        } catch (error) {
            console.error("Status update failed:", error);
            alert("עדכון הסטטוס נכשל.");
        }
    }
};