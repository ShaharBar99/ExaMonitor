import { notificationsApi } from '../api/notificationsApi';

export const notificationHandlers = {
  loadNotifications: async (contextId, setNotifications, setLoading) => {
    try {
      // אם שלחנו פונקציית טעינה, נפעיל אותה
      if (setLoading) setLoading(true); 
      
      const data = await notificationsApi.getNotifications(contextId);
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      // זה החלק הכי חשוב - לכבות את הטעינה!
      if (setLoading) setLoading(false);
    }
  }
};