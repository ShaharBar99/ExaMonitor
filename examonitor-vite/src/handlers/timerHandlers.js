import { timerApi } from '../api/timerApi';

export const timerHandlers = {
  /**
   * פונקציה שמחזירה את כמות השניות שנותרו לסיום המבחן
   */
  getRemainingSeconds: async (examId) => {
    try {
      const timing = await timerApi.getExamTiming(examId);
      
      const start = new Date(timing.startTime).getTime();
      const now = new Date().getTime();
      
      // סך כל הזמן המוקצב בשניות (זמן מקורי + תוספות)
      const totalAllocatedSeconds = (timing.originalDuration + timing.extraTime) * 60;
      
      // כמה זמן עבר מההתחלה בשניות
      const elapsedSeconds = Math.floor((now - start) / 1000);
      
      // חישוב היתרה
      const remaining = totalAllocatedSeconds - elapsedSeconds;
      
      return remaining > 0 ? remaining : 0;
    } catch (error) {
      console.error("Error calculating time:", error);
      return 5391; // ערך ברירת מחדל במקרה של שגיאה
    }
  }
};