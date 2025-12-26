// src/handlers/attendanceHandlers.js
import { attendanceApi } from "../api/attendanceApi";

export const attendanceHandlers = {
    /**
     * טעינה ראשונית של נתוני המבחן
     */
    initConsole: async (examId, setStudents, setLoading) => {
        try {
            setLoading(true);
            const data = await attendanceApi.fetchStudentsByExam(examId);
            setStudents(data);
        } catch (error) {
            console.error("Failed to load attendance", error);
        } finally {
            setLoading(false);
        }
    },

    /**
     * לוגיקת שינוי סטטוס סטודנט
     */
    changeStudentStatus: async (studentId, newStatus, setStudents) => {
        // 1. עדכון אופטימי ב-UI (כדי שהמשתמש ירגיש שהמערכת מהירה)
        setStudents(currentStudents => 
            currentStudents.map(s => s.id === studentId ? { ...s, status: newStatus } : s)
        );

        try {
            // 2. עדכון בשרת
            const response = await attendanceApi.updateStudentStatus(studentId, newStatus);
            if (!response.success) throw new Error();
        } catch (error) {
            // 3. Rollback במקרה של שגיאה (החזרת הסטטוס הקודם)
            console.error("Status update failed, rolling back...");
            // כאן אפשר להוסיף לוגיקה שמחזירה את המצב לקדמותו
        }
    }
};