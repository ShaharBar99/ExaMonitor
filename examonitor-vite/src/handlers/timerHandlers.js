import { timerApi } from '../api/timerApi';

/**
 * Handlers for exam timer logic.
 */
export const timerHandlers = {
  /**
   * Calculates the remaining seconds for an exam.
   * @param {string} examId - The exam ID.
   * @returns {Promise<number>} Remaining seconds.
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
  },

  /**
   * Pauses the exam timer.
   * @param {string} examId - The exam ID.
   * @param {string} reason - Reason for pausing.
   */
  handlePause: async (examId, reason) => {
    try {
      // קריאה ל-Route: POST /exams/:id/pause 
      return await timerApi.pauseExam(examId, reason);
    } catch (error) {
      console.error("Failed to pause exam:", error);
      throw error;
    }
  },

  /**
   * Retrieves timing data for an exam.
   * @param {string} examId - The exam ID.
   * @returns {Promise<object>} Timing data object.
   */
  getTimeDataByExamId: async (examId) => {
    try {
      const examData = await timerApi.getExamTiming(examId); 
      return {start_time: examData.startTime, original_duration: examData.originalDuration, extra_time: examData.extraTime};
    } catch (error) {
      console.error("Failed to get exam timing:", error);
      throw error;
    }
  },

  /**
   * Resumes the exam timer.
   * @param {string} examId - The exam ID.
   */
  handleResume: async (examId) => {
    try {
      // קריאה ל-Route: POST /exams/:id/resume 
      return await timerApi.resumeExam(examId);
    } catch (error) {
      console.error("Failed to resume exam:", error);
      throw error;
    }
  }
};