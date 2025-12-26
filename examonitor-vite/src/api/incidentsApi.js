// src/api/incidentApi.js
export const incidentApi = {
    // שליחת קריאה לעזרה למשגיח קומה
    callFloorManager: async (examId, roomId) => {
        console.log(`[API] Calling floor manager to Room: ${roomId}, Exam: ${examId}`);
        return new Promise(resolve => setTimeout(() => resolve({ success: true }), 400));
    }
};

// src/handlers/incidentHandlers.js
import { incidentApi } from "../api/incidentApi";

export const incidentHandlers = {
    handleCallManager: async (examId, roomId) => {
        const confirmed = window.confirm("האם לקרוא למשגיח קומה?");
        if (confirmed) {
            const res = await incidentApi.callFloorManager(examId, roomId);
            if (res.success) alert("משגיח הקומה בדרך אליך.");
        }
    }
};