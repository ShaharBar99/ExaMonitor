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

// //// Actual usage:
// export const incidentsApi = {
//   // POST /incidents
//   reportIncident: async (incidentData) => {
//     // דיווח על אירוע חריג (רעש, בעיה טכנית, חשד להעתקה)
//     return http.post('/incidents', incidentData);
//   },

//   // POST /incidents/call-manager
//   callFloorManager: async (roomId, reason) => {
//     // קריאה דחופה למנהל הקומה לחדר ספציפי
//     return http.post('/incidents/call-manager', { roomId, reason });
//   },

//   // PATCH /incidents/:id/status
//   resolveIncident: async (incidentId, status = 'resolved') => {
//     // עדכון סטטוס אירוע (בטיפול, נסגר)
//     return http.patch(`/incidents/${incidentId}/status`, { status });
//   },


// };