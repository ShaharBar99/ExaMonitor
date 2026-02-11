import { apiFetch } from './http';

/**
 * API for interacting with the ExamBot.
 */
export const botAPI = {
  /**
   * Sends a chat message to the bot.
   * @param {Object} payload - The message payload.
   * @returns {Promise<Object>} The bot's response.
   */
  async postChatMessage(payload) {
    return apiFetch('/bot/chat', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Retrieves the current status of the bot.
   * @returns {Promise<Object>} The bot status.
   */
  async getBotStatus() {
    return apiFetch('/bot/status');
  },
};