// src/api/attendanceApi.js

// נתונים מדומים (Mock) לצרכי פיתוח - מבוסס על המבנה של הפרויקט המקורי שלך
const MOCK_STUDENTS = [
    { id: "3124456", name: "יוסי כהן", status: "במבחן", desk: "1", startTime: "09:00" },
    { id: "2044556", name: "מיכל לוי", status: "שירותים", desk: "2", startTime: "09:05" },
    { id: "3055667", name: "דניאל אברהם", status: "במבחן", desk: "3", startTime: "09:10" },
    { id: "2088990", name: "רוני דיין", status: "סיים", desk: "4", startTime: "08:50" }
];

export const attendanceApi = {
    /**
     * מביא את רשימת הסטודנטים המשויכים למבחן ספציפי
     */
    fetchStudentsByExam: async (examId) => {
        return new Promise((resolve) => {
            console.log(`[API] Fetching students for exam: ${examId}`);
            setTimeout(() => resolve(MOCK_STUDENTS), 600);
        });
    },

    /**
     * מעדכן סטטוס של סטודנט בשרת (למשל יציאה לשירותים)
     */
    updateStudentStatus: async (studentId, newStatus) => {
        return new Promise((resolve) => {
            console.log(`[API] Updating student ${studentId} to status: ${newStatus}`);
            setTimeout(() => resolve({ success: true }), 300);
        });
    }
};