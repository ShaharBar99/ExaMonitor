export const timerApi = {
  /**
   * קבלת הגדרות הזמן של המבחן מהשרת
   * @param {string} examId - מזהה המבחן
   */
  getExamTiming: async (examId) => {
    return new Promise((resolve) => {
      // דימוי קריאת שרת
      setTimeout(() => {
        resolve({
          // שעת התחלה - נגדיר אותה כחצי שעה לפני הזמן הנוכחי כדי לראות את הטיימר רץ
          startTime: new Date(Date.now() - 30 * 60000).toISOString(), 
          // משך המבחן המקורי בדקות
          originalDuration: 180, 
          // תוספות זמן שניתנו במהלך המבחן (בדקות)
          extraTime: 15,
          // האם המבחן הופסק/הוקפא
          isPaused: false
        });
      }, 300);
    });
  },

  /**
   * עדכון תוספת זמן (עבור מנהל קומה/מרצה)
   */
  addExtraTime: async (examId, minutes) => {
    console.log(`API: Adding ${minutes} minutes to exam ${examId}`);
    return { success: true, newDuration: 195 };
  }
};