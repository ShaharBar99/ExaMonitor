import { incidentsApi } from '../api/incidentsApi';

export const incidentHandlers = {
  /**
   * קריאה דחופה למנהל קומה
   * Route: POST /incidents/call-manager
   */
  handleCallManager: async (roomId) => {
    try {
      const reason = prompt("מהי סיבת הקריאה?");
      
      // בדיקת תקינות קלט
      if (reason === null) return; 
      if (!reason.trim()) {
        alert("חובה להזין סיבת קריאה");
        return;
      }

      // שליחה ל-API לפי הפורמט: { roomId, reason }
      await incidentsApi.callFloorManager(roomId, reason);
      alert("קריאה נשלחה למנהל הקומה");
      
    } catch (error) {
      console.error("Failed to call floor manager:", error);
      alert("תקלה בשליחת הקריאה. נסה שנית או צור קשר טלפוני.");
    }
  },

  /**
   * שליחת דוח אירוע מפורט (טופס)
   * Route: POST /incidents
   */
  submitReport: async (formData, reporterId) => { // הוספת reporterId
  try {
      if (!formData.incidentType || !formData.severity || !formData.description) {
        throw new Error("Missing required report fields");
      }

      // צירוף ה-ID של המדווח לנתונים שנשלחים
      const fullData = { ...formData, reporterId };
    
      await incidentsApi.reportIncident(fullData);
      alert("הדיווח נשלח בהצלחה ותועד במערכת");
    
    } catch (error) {
      console.error("Incident report submission failed:", error);
      alert("שגיאה בשליחת הדיווח: " + error.message);
    }
  },

  /**
   * סגירת אירוע או עדכון סטטוס (לשימוש מנהל קומה)
   * Route: PATCH /incidents/:id/status
   */
  handleResolveIncident: async (incidentId, setNotifications) => {
    try {
      // עדכון בשרת לסטטוס 'resolved'
      await incidentsApi.resolveIncident(incidentId, 'resolved');
      
      // עדכון ה-UI המקומי (במידה ומוצג ברשימת התראות)
      if (setNotifications) {
        setNotifications(prev => prev.map(inc => 
          inc.id === incidentId ? { ...inc, status: 'resolved' } : inc
        ));
      }
      
      alert("האירוע סומן כטופל");
    } catch (error) {
      console.error("Failed to resolve incident:", error);
      alert("עדכון סטטוס האירוע נכשל.");
    }
  },

  /**
   * טעינת רשימת אירועים למבחן
   * Route: GET /incidents?examId=:id
   */
  loadIncidents: async (examId, setIncidents) => {
    try {
      const response = await incidentsApi.getIncidents(examId);
      const data = Array.isArray(response) ? response : (response?.incidents || response?.data || []);
      setIncidents(data);
    } catch (error) {
      console.error("Failed to load incidents:", error);
      setIncidents([]);
    }
  }
};