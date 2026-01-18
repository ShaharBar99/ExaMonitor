import { apiFetch } from './http';

export const incidentsApi = {
  reportIncident: async (incidentData) => {
    return apiFetch('/incidents', { method: 'POST', body: incidentData });
  },

  callFloorManager: async (roomId, reason) => {
    return apiFetch('/incidents/call-manager', { method: 'POST', body: { roomId, reason } });
  },

  //tk added
  listByExam: async (examId) => {
    return apiFetch(`/incidents?examId=${encodeURIComponent(examId)}`);
  },

};