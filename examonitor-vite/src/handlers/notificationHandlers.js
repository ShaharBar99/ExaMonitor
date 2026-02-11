import { notificationsApi } from '../api/notificationsApi';

/**
 * Handlers for notification management.
 */
export const notificationHandlers = {
  /**
   * Loads notifications and audit logs for a context.
   * Route: GET /notifications?contextId=:id
   * @param {string} contextId - The context ID.
   * @param {Function} setNotifications - State setter for notifications.
   * @param {Function} setLoading - State setter for loading status.
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
   * Marks a specific notification as read.
   * 204 No Content is treated as success and returns null
   * @param {string} notificationId - The notification ID.
   * @param {Function} setNotifications - State setter to update local UI.
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