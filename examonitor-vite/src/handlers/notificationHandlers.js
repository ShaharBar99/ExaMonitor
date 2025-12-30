import { notificationsApi } from '../api/notificationsApi';

export const notificationHandlers = {
  /**
   * טעינת התראות ויומן אירועים (Audit Log)
   * Route: GET /notifications?contextId=:id
   */
  loadNotifications: async (contextId, setNotifications, setLoading) => {
    try {
      if (setLoading) setLoading(true); 
      
      const response = await notificationsApi.getNotifications(contextId);
      
      // חילוץ המערך מתוך האובייקט בהתאם למפרט ה-Backend 
      const notificationsArray = response?.notifications || [];
      setNotifications(notificationsArray);
      
    } catch (error) {
      console.error("Error loading notifications:", error);
      // במקרה של שגיאה, נחזיר מערך ריק כדי למנוע קריסה של ה-UI
      setNotifications([]);
    } finally {
      if (setLoading) setLoading(false);
    }
  },

  /**
   * סימון התראה ספציפית כנקראה
   * 204 No Content is treated as success and returns null
   */
  handleMarkAsRead: async (notificationId, setNotifications) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      
      // עדכון ה-State המקומי כדי להסיר או לעדכן את ההתראה בלי לטעון הכל מחדש
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }
};