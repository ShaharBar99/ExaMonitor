// export const notificationsApi = {
//   // קבלת היסטוריית התראות לחדר או לקומה
//   getNotifications: async (contextId) => {
//     return [
//       { id: 1, time: "10:00", message: "הבחינה החלה", type: "info" },
//       { id: 2, time: "10:15", message: "סטודנט 123456789 יצא לשירותים", type: "action" },
//       { id: 3, time: "10:45", message: "קריאה דחופה מחדר 302", type: "warning" }
//     ];
//   },
  
//   markAsRead: async (notificationId) => {
//     return { success: true };
//   }
// };
import { apiFetch } from './http';

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";

export const notificationsApi = {
  /**
   * קבלת לוג הודעות ואירועים (Audit Log) לפי מזהה בחינה או קומה.
   * עונה על הדרישה להצגת התראות חיות על אירועים חריגים בזמן אמת[cite: 58, 61].
   */
  getNotifications: async (contextId) => {
    if (useMock) {
      // נתוני דמה המדמים לוג אירועים (Audit Trail) כפי שנדרש במסמך [cite: 53]
      return [
        { id: 1, time: "10:00", message: "הבחינה החלה", type: "info" },
        { id: 2, time: "10:15", message: "סטודנט 123456789 יצא לשירותים", type: "action" },
        { id: 3, time: "10:45", message: "קריאה דחופה מחדר 302: חסרים טפסים", type: "warning" },
        { id: 4, time: "11:00", message: "התראת בוט: סטודנט טרם חזר משירותים מעל 15 דקות", type: "critical" }
      ];
    }
    
    // שימוש ב-apiFetch עבור קריאת אמת [cite: 67]
    return apiFetch(`/notifications?contextId=${contextId}`);
  },

  /**
   * סימון התראה כנקראה.
   * מאפשר למשגיח או למנהל הקומה לנהל את זרם ההתראות בדשבורד[cite: 57, 64].
   */
  markAsRead: async (notificationId) => {
    if (useMock) {
      console.log(`Mock API: Notification ${notificationId} marked as read`);
      return { success: true };
    }

    return apiFetch(`/notifications/${notificationId}/read`, {
      method: "PATCH"
    });
  }
};