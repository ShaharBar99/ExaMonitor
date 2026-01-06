// export const incidentsApi = {
//   // שליחת דיווח חדש
//   reportIncident: async (incidentData) => {
//     console.log("API: Reporting Incident", incidentData);
//     return { success: true, incidentId: Math.random().toString(36).substr(2, 9) };
//   },
  
//   // קריאה למנהל קומה
//   callFloorManager: async (roomId, reason) => {
//     console.log(`API: Calling Manager to Room ${roomId} for: ${reason}`);
//     return { success: true };
//   }
// };

// // //// Actual usage:
// // export const incidentsApi = {
// //   // POST /incidents
// //   reportIncident: async (incidentData) => {
// //     // דיווח על אירוע חריג (רעש, בעיה טכנית, חשד להעתקה)
// //     return http.post('/incidents', incidentData);
// //   },

// //   // POST /incidents/call-manager
// //   callFloorManager: async (roomId, reason) => {
// //     // קריאה דחופה למנהל הקומה לחדר ספציפי
// //     return http.post('/incidents/call-manager', { roomId, reason });
// //   },

// //   // PATCH /incidents/:id/status
// //   resolveIncident: async (incidentId, status = 'resolved') => {
// //     // עדכון סטטוס אירוע (בטיפול, נסגר)
// //     return http.patch(`/incidents/${incidentId}/status`, { status });
// //   },


// // };
import { apiFetch } from './http';

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";
export const incidentsApi = {
  // דיווח על אירוע חריג (רעש, חשד להעתקה, בעיה טכנית) [cite: 6, 61]
  reportIncident: async (incidentData) => {
    if (useMock) return { success: true, incidentId: "inc-123" };
    return apiFetch('/incidents', { method: "POST", body: incidentData });
  },

  // קריאה דחופה למנהל קומה 
  callFloorManager: async (roomId, reason) => {
    if (useMock) return { success: true };
    return apiFetch('/incidents/call-manager', { method: "POST", body: { roomId, reason } });
  }
};

export const notificationsApi = {
  // קבלת לוג הודעות ואירועים לפי מזהה בחינה או קומה [cite: 53, 58]
  getNotifications: async (contextId) => {
    if (useMock) {
      return [
        { id: 1, time: "10:00", message: "הבחינה החלה", type: "info" },
        { id: 2, time: "10:45", message: "קריאה דחופה מחדר 302", type: "warning" }
      ];
    }
    return apiFetch(`/notifications?contextId=${contextId}`);
  }
};