import { apiFetch } from './http';

export const botAPI = {
  async postChatMessage(payload) {
    return apiFetch('/bot/chat', {
      method: 'POST',
      body: payload,
    });
  },

  async getBotStatus() {
    return apiFetch('/bot/status');
  },
};