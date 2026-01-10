// export const timerApi = {
//   /**
//    * קבלת הגדרות הזמן של המבחן מהשרת
//    * @param {string} examId - מזהה המבחן
//    */
//   getExamTiming: async (examId) => {
//     return new Promise((resolve) => {
//       // דימוי קריאת שרת
//       setTimeout(() => {
//         resolve({
//           // שעת התחלה - נגדיר אותה כחצי שעה לפני הזמן הנוכחי כדי לראות את הטיימר רץ
//           startTime: new Date(Date.now() - 30 * 60000).toISOString(), 
//           // משך המבחן המקורי בדקות
//           originalDuration: 180, 
//           // תוספות זמן שניתנו במהלך המבחן (בדקות)
//           extraTime: 15,
//           // האם המבחן הופסק/הוקפא
//           isPaused: false
//         });
//       }, 300);
//     });
//   },

//   /**
//    * עדכון תוספת זמן (עבור מנהל קומה/מרצה)
//    */
//   addExtraTime: async (examId, minutes) => {
//     console.log(`API: Adding ${minutes} minutes to exam ${examId}`);
//     return { success: true, newDuration: 195 };
//   }
// };

// // //// Actual usage:
// // export const timerApi = {
// //   // GET /exams/:id/timing
// //   getExamTiming: async (examId) => {
// //     // סנכרון זמנים: startTime, originalDuration, extraTime, isPaused
// //     return http.get(`/exams/${examId}/timing`);
// //   },

// //   // POST /exams/:id/extra-time
// //   addExtraTime: async (examId, minutes, reason) => {
// //     // הוספת תוספת זמן גלובלית לבחינה
// //     return http.post(`/exams/${examId}/extra-time`, { minutes, reason });
// //   },
// //    /**
//   //  * POST /exams/:id/pause
//   //  * עצירת הבחינה לכולם (למשל במקרה של אזעקה או תקלה)
//   //  */
//   // pauseExam: async (examId, reason) => {
//   //   return http.post(`/exams/${examId}/pause`, { reason });
//   // },

//   // /**
//   //  * POST /exams/:id/resume
//   //  * המשך הבחינה לאחר עצירה
//   //  */
//   // resumeExam: async (examId) => {
//   //   return http.post(`/exams/${examId}/resume`, {});
//   // }
// // };
import { apiFetch } from './http';
const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";
export const timerApi = {
  // קבלת הגדרות זמן וסנכרון (זמן התחלה, משך, הארכות) 
  getExamTiming: async (examId) => {
    if (useMock) {
      return { startTime: new Date().toISOString(), originalDuration: 180, extraTime: 15, isPaused: false };
    }
    return apiFetch(`/exams/${examId}/timing`);
  },

  // עדכון תוספת זמן (גלובלי או לסטודנט ספציפי) 
  addExtraTime: async (examId, minutes, reason, studentId = null) => {
    if (useMock) return { success: true };
    return apiFetch(`/exams/${examId}/extra-time`, { 
      method: "POST", 
      body: { minutes, reason, studentId } 
    });
  }
};