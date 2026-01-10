import { apiFetch } from './http';

export const notificationsApi = {
  getNotifications: async (contextId) => {
    return apiFetch(`/notifications?contextId=${contextId}`);
  },
};
