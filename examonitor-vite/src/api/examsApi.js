// export const examsApi = {
//   // קבלת פרטי מבחן ספציפי
//   getExamById: async (examId) => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         resolve({
//           id: examId,
//           name: "מבוא למדעי המחשב",
//           courseId: "CS101",
//           startTime: new Date().toISOString(),
//           duration: 180, // דקות
//           status: "started"
//         });
//       }, 500);
//     });
//   },

//   // שליחת הודעה מנהלתית מתפרצת (Broadcast)
//   broadcastAnnouncement: async (examId, message) => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         console.log(`Fake API: Announcement for exam ${examId}: ${message}`);
//         resolve({ success: true, timestamp: new Date().toISOString() });
//       }, 400);
//     });
//   },

//   // שינוי סטטוס בחינה (started, paused, ended)
//   updateExamStatus: async (examId, status) => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         console.log(`Fake API: Exam ${examId} status updated to: ${status}`);
//         resolve({ success: true, newStatus: status });
//       }, 400);
//     });
//   }
// };

// // Actual usage:
// // export const examsApi = {
// //   // GET /exams/:id
// //   getExamById: async (examId) => {
// //     // קבלת פרטי מבחן ליבה (שם, קוד, משך)
// //     return http.get(`/exams/${examId}`);
// //   },



// //   // POST /exams/:id/broadcast
// //   broadcastAnnouncement: async (examId, message) => {
// //     // שליחת הודעה מנהלתית מתפרצת לכלל המעורבים בבחינה
// //     return http.post(`/exams/${examId}/broadcast`, { message });
// //   },

// //   // PATCH /exams/:id/status
// //   updateExamStatus: async (examId, status) => {
// //     // שינוי סטטוס בחינה (started, paused, ended)
// //     return http.patch(`/exams/${examId}/status`, { status });
// //   }
// // };
import { apiFetch } from './http';

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";
export const examsApi = {
  // קבלת פרטי בחינה (קורס, תאריך, שעה, אולם) [cite: 26]
  getExamById: async (examId) => {
    if (useMock) {
      return { id: examId, name: "מבוא למדעי המחשב", courseId: "CS101", startTime: new Date().toISOString(), duration: 180, status: "started" };
    }
    return apiFetch(`/exams/${examId}`);
  },

  // שליחת הודעה מנהלתית מתפרצת (Broadcast) לכל המעורבים 
  broadcastAnnouncement: async (examId, message) => {
    if (useMock) return { success: true, timestamp: new Date().toISOString() };
    return apiFetch(`/exams/${examId}/broadcast`, { method: "POST", body: { message } });
  },

  // עדכון סטטוס בחינה (פעילה, מושהית, הסתיימה) 
  updateExamStatus: async (examId, status) => {
    if (useMock) return { success: true, newStatus: status };
    return apiFetch(`/exams/${examId}/status`, { method: "PATCH", body: { status } });
  }
};