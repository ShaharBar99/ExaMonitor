import { incidentsApi } from '../api/incidentsApi';

/**
 * Handlers for incident reporting and management.
 */
export const incidentHandlers = {
  /**
   * Sends an urgent call to the floor manager.
   * Route: POST /incidents/call-manager
   * @param {string} roomId - The room ID.
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
   * Submits a detailed incident report.
   * Route: POST /incidents
   * @param {object} formData - The report data.
   * @param {string} reporterId - The ID of the user reporting.
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
   * Resolves an incident or updates its status.
   * Route: PATCH /incidents/:id/status
   * @param {string} incidentId - The incident ID.
   * @param {Function} setNotifications - State setter to update local UI.
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
   * Loads the list of incidents for an exam.
   * Route: GET /incidents?examId=:id
   * @param {string} examId - The exam ID.
   * @param {Function} setIncidents - State setter for incidents.
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