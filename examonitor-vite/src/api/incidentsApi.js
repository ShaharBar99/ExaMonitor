export const incidentsApi = {
  // שליחת דיווח חדש
  reportIncident: async (incidentData) => {
    console.log("API: Reporting Incident", incidentData);
    return { success: true, incidentId: Math.random().toString(36).substr(2, 9) };
  },
  
  // קריאה למנהל קומה
  callFloorManager: async (roomId, reason) => {
    console.log(`API: Calling Manager to Room ${roomId} for: ${reason}`);
    return { success: true };
  }
};