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