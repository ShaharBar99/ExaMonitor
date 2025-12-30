export const notificationsApi = {
  // קבלת היסטוריית התראות לחדר או לקומה
  getNotifications: async (contextId) => {
    return [
      { id: 1, time: "10:00", message: "הבחינה החלה", type: "info" },
      { id: 2, time: "10:15", message: "סטודנט 123456789 יצא לשירותים", type: "action" },
      { id: 3, time: "10:45", message: "קריאה דחופה מחדר 302", type: "warning" }
    ];
  },
  
  markAsRead: async (notificationId) => {
    return { success: true };
  }
};

// //// Actual usage:
// export const notificationsApi = {
//   // GET /notifications?contextId=:id
//   // GET /notifications?contextId=:id
//   getNotifications: async (contextId) => {
//     // קבלת לוג הודעות ואירועים (Audit Log) לפי מזהה בחינה או קומה
//     return http.get(`/notifications?contextId=${contextId}`);
//   },
//   // PATCH /notifications/:id/read
//   markAsRead: async (notificationId) => {
//     // סימון התראה כנקראה
//     return http.patch(`/notifications/${notificationId}/read`);
//   }
// };