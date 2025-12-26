// src/api/attendanceApi.js
import { MOCK_STUDENTS } from "../mocks/studentsMock";
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