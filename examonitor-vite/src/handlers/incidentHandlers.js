import { incidentsApi } from '../api/incidentsApi';

export const incidentHandlers = {
  // קריאה למנהל קומה
  handleCallManager: async (examId, roomId) => {
    try {
      const reason = prompt("מהי סיבת הקריאה?");
      
      // אם המשתמש לחץ על 'ביטול' או לא הזין סיבה
      if (reason === null) return; 
      if (!reason.trim()) {
        alert("חובה להזין סיבת קריאה");
        return;
      }

      await incidentsApi.callFloorManager(roomId, reason);
      alert("קריאה נשלחה למנהל הקומה");
      
    } catch (error) {
      console.error("Failed to call floor manager:", error);
      alert("תקלה בשליחת הקריאה. נסה שנית או צור קשר טלפוני.");
    }
  },

  // שליחת דוח אירוע מהטופס
  submitReport: async (formData, navigate) => {
    try {
      // בדיקת תקינות בסיסית לפני שליחה
      if (!formData || !formData.studentId || !formData.description) {
        throw new Error("Missing required report fields");
      }

      await incidentsApi.reportIncident(formData);
      alert("הדיווח נשלח בהצלחה ותועד במערכת");
      
      if (navigate) {
        navigate(-1); // חזרה לדף הקודם
      }
    } catch (error) {
      console.error("Incident report submission failed:", error);
      alert("הדיווח לא נשלח. וודא שכל השדות מלאים ונסה שוב.");
    }
  }
};