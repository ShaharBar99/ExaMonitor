// export const attendanceApi = {
//   // קבלת רשימת סטודנטים בחדר (מדומה)
//   getStudentsByRoom: async (roomId) => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         resolve([
//           { id: "123456789", name: "ישראל ישראלי", status: "بמבחן", desk: 1 },
//           { id: "987654321", name: "שרה כהן", status: "סיים", desk: 2 },
//           { id: "456789123", name: "אבי לוי", status: "שירותים", desk: 3 },
//           { id: "555666777", name: "מיכל אברהם", status: "במבחן", desk: 4 }
//         ]);
//       }, 600);
//     });
//   },

//   // עדכון סטטוס סטודנט
//   updateStudentStatus: async (studentId, status) => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         console.log(`Fake API: Student ${studentId} status updated to ${status}`);
//         resolve({ success: true });
//       }, 300);
//     });
//   },
//   getExamsOnFloor: async (floorId) => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         resolve([
//           { id: "EX-101", name: "מבוא למדעי המחשב", rooms: ["301", "302"], status: "active" },
//           { id: "EX-202", name: "אלגוריתמים", rooms: ["304", "305"], status: "active" },
//           { id: "EX-303", name: "מבני נתונים", rooms: ["308"], status: "warning" }
//         ]);
//       }, 500);
//     });
//   },
//   // סיכום סטטיסטי לקומה (למנהל קומה)
//   getFloorSummary: async (floorId) => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         resolve({
//           totalStudents: 120,
//           active: 85,
//           submitted: 30,
//           inRestroom: 5,
//           urgentIncidents: 2
//         });
//       }, 500);
//     });
//   },

//   // הקצאת משגיח לחדר
//   assignSupervisor: async (roomId, supervisorId) => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         console.log(`Fake API: Supervisor ${supervisorId} assigned to room ${roomId}`);
//         resolve({ success: true });
//       }, 400);
//     });
//   }
// };

// //// Actual usage:
// // export const attendanceApi = {
// //   // GET /rooms/:roomId/students
// //   getStudentsByRoom: async (roomId) => {
// //     // רשימת סטודנטים, מספרי שולחן וסטטוס נוכחות בחדר ספציפי
// //     return http.get(`/rooms/${roomId}/students`);
// //   },

// //   // PATCH /students/:id/status
// //   updateStudentStatus: async (studentId, status) => {
// //     // עדכון סטטוס סטודנט (נמצא, יצא לשירותים, הגיש)
// //     return http.patch(`/students/${studentId}/status`, { status });
// //   },

// //   // GET /rooms/summary?floor=:floorId
// //   getFloorSummary: async (floorId) => {
// //     // סיכום סטטיסטי לקומה (כמה הגישו, כמה פעילים, כמה אירועים חריגים)
// //     return http.get(`/rooms/summary?floor=${floorId}`);
// //   },
// //
// //   getExamsOnFloor: async (floorId) => {
//       // --- קריאה ל-API אמיתי (בהערה) ---
//       // return http.get(`/rooms/summary?floor=${floorId}`);

// //   // PATCH /rooms/:id/supervisor
// //   assignSupervisor: async (roomId, supervisorId) => {
// //     // הקצאת משגיח לחדר (פעולת מנהל קומה)
// //     return http.patch(`/rooms/${roomId}/supervisor`, { supervisorId });
// //   }
// // };
// //
// src/api/attendanceApi.js
import { apiFetch } from './http';

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";

export const attendanceApi = {
  // --- פונקציות קיימות (לצורך הקשר) ---
  getStudentsByRoom: async (roomId) => {
    if (useMock) return [{ id: "1", name: "ישראל ישראלי", status: "במבחן" }];
    return apiFetch(`/rooms/${roomId}/students`);
  },

  updateStudentStatus: async (studentId, status) => {
    if (useMock) return { success: true };
    return apiFetch(`/students/${studentId}/status`, { method: "PATCH", body: { status } });
  },

  // --- הפונקציות החדשות שצריך להוסיף ---

  /**
   * משיכת כל המבחנים והחדרים המשויכים לקומה מסוימת
   * תואם ל-handleGetExamsOnFloor ב-Handler
   */
  getExamsOnFloor: async (floorId) => {
    if (useMock) {
      // נתוני Mock התואמים למבנה של RoomGrid
      return [
        { 
          id: "EX-101", 
          name: "מבוא למדעי המחשב", 
          rooms: ["301", "302"], 
          status: "active",
          assignedSupervisor: "משה כהן" 
        },
        { 
          id: "EX-202", 
          name: "אלגוריתמים", 
          rooms: ["304"], 
          status: "warning",
          assignedSupervisor: null 
        }
      ];
    }
    // קריאת API אמיתית
    return apiFetch(`/exams/floor/${floorId}`);
  },

  /**
   * הקצאת משגיח לחדר ספציפי
   * תואם ל-handleAssignSupervisor ב-Handler
   */
  assignSupervisor: async (roomId, supervisorId) => {
    if (useMock) {
      console.log(`Mock API: Supervisor ${supervisorId} assigned to room ${roomId}`);
      return { success: true };
    }
    // קריאת API אמיתית - שימוש ב-PATCH לעדכון משאב קיים
    return apiFetch(`/rooms/${roomId}/supervisor`, {
      method: "PATCH",
      body: { supervisorId }
    });
  },

  /**
   * סיכום סטטיסטי לקומה (אופציונלי - לשימוש עתידי ב-Handler)
   */
  getFloorSummary: async (floorId) => {
    if (useMock) {
      return { totalStudents: 120, active: 85, submitted: 30, inRestroom: 5 };
    }
    return apiFetch(`/rooms/summary?floor=${floorId}`);
  }
};