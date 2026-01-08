export const IncidentService = {
  async report(incidentData) {
    console.log('Reporting incident:', incidentData);
    return { success: true, incidentId: `inc_${Date.now()}` };
  },

  async callManager(roomId, reason) {
    console.log(`Calling manager to room ${roomId} for: ${reason}`);
    return { success: true };
  },
};
