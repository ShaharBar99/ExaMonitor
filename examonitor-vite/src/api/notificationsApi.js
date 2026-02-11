import { apiFetch } from './http';

/**
 * API for fetching notifications.
 */
export const notificationsApi = {
  /**
   * Retrieves notifications for a specific context.
   * @param {string} contextId - The context ID (e.g., user ID or exam ID).
   * @returns {Promise<Object>} List of notifications.
   */
  getNotifications: async (contextId) => {
    return apiFetch(`/notifications?contextId=${contextId}`);
  },
};
