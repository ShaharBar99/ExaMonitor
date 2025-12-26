// src/handlers/incidentHandlers.js

export const incidentHandlers = {
    /**
     * מטפל בקריאה למשגיח קומה
     * @param {string} examId - מזהה המבחן
     * @param {string} roomId - מספר החדר
     */
    handleCallManager: async (examId, roomId) => {
        // בעתיד כאן תהיה קריאה ל-API (למשל: axios.post('/incidents/call-manager', ...))
        console.log(`[Incident] Calling manager to Room ${roomId} for Exam ${examId}`);
        
        // כרגע נשתמש באישור פשוט למשתמש
        const isConfirmed = window.confirm(`האם לשלוח קריאה למשגיח קומה לחדר ${roomId}?`);
        
        if (isConfirmed) {
            // כאן אפשר להוסיף לוגיקה של טעינה או הצלחה
            alert("קריאה נשלחה. משגיח קומה יגיע בהקדם.");
            return true;
        }
        return false;
    },

    /**
     * דיווח על אירוע חריג (למשל חשד להעתקה)
     */
    reportIncident: async (studentId, type) => {
        console.log(`[Incident] Reporting ${type} for student ${studentId}`);
        // לוגיקת דיווח...
    }
};