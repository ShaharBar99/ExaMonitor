import { apiFetch } from './http';

export const incidentsApi = {
  reportIncident: async (incidentData) => {
    return apiFetch('/incidents', { method: 'POST', body: incidentData });
  },

  callFloorManager: async (roomId, reason) => {
    return apiFetch('/incidents/call-manager', { method: 'POST', body: { roomId, reason } });
  },

  resolveIncident: async (id, status) => {
    return apiFetch(`/incidents/${id}/status`, { method: 'PATCH', body: { status } });
  },

  getIncidents: async (examId) => {
    const params = new URLSearchParams();
    if (examId) params.set('examId', examId);
    return apiFetch(`/incidents?${params.toString()}`);
  },
};