// 
import { apiFetch } from "./http"; // Import REST helper

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";

/**
 * API for messaging and chat.
 */
export const messageApi = {
  /**
   * Retrieves message history for a specific exam and channel type.
   * @param {string} examId - The exam ID.
   * @param {string} type - The channel type (e.g., 'bot_to_supervisor').
   * @returns {Promise<Array>} List of messages.
   */
  getMessages: async (examId, type) => {
    if (useMock) {
      const allMocks = {
        "bot_to_supervisor": [{ id: 1, text: "האם כל הסטודנטים הגיעו?", sender: "bot", timestamp: "08:55" }],
        "supervisor_to_floor": [{ id: 2, text: "חסרים טפסים בחדר 302", sender: "me", timestamp: "09:00" }]
      };
      return allMocks[type] || [];
    }
    return apiFetch(`/chat/${examId}?type=${type}`);
  },

  /**
   * Sends a message to the bot or team.
   * @param {string} examId - The exam ID.
   * @param {Object} payload - The message payload.
   * @returns {Promise<Object>} The sent message.
   */
  sendMessage: async (examId, payload) => {
    if (useMock) return { id: Date.now(), text: payload.text, sender: 'me', timestamp: "10:00" };
    return apiFetch(`/chat/${examId}`, { method: "POST", body: payload });
  }
};