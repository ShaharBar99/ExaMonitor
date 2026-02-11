import { apiFetch } from './http';

/**
 * API for managing incidents.
 */
export const incidentsApi = {
  /**
   * Reports a new incident.
   * @param {Object} incidentData - The incident data.
   * @returns {Promise<Object>} The created incident.
   */
  reportIncident: async (incidentData) => {
    return apiFetch('/incidents', { method: 'POST', body: incidentData });
  },

  /**
   * Calls the floor manager for a specific room.
   * @param {string} roomId - The room ID.
   * @param {string} reason - The reason for the call.
   * @returns {Promise<Object>} The result.
   */
  callFloorManager: async (roomId, reason) => {
    return apiFetch('/incidents/call-manager', { method: 'POST', body: { roomId, reason } });
  },

  /**
   * Resolves an incident or updates its status.
   * @param {string} id - The incident ID.
   * @param {string} status - The new status.
   * @returns {Promise<Object>} The updated incident.
   */
  resolveIncident: async (id, status) => {
    return apiFetch(`/incidents/${id}/status`, { method: 'PATCH', body: { status } });
  },

  /**
   * Retrieves incidents, optionally filtered by exam ID.
   * @param {string} [examId] - The exam ID to filter by.
   * @returns {Promise<Object>} List of incidents.
   */
  getIncidents: async (examId) => {
    const params = new URLSearchParams();
    if (examId) params.set('examId', examId);
    return apiFetch(`/incidents?${params.toString()}`);
  },
  
  /**
   * Lists incidents for a specific exam.
   * @param {string} examId - The exam ID.
   * @returns {Promise<Object>} List of incidents.
   */
  listByExam: async (examId) => {
    return apiFetch(`/incidents/${encodeURIComponent(examId)}`);
  },
};