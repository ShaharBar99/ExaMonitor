// 
import { apiFetch } from "./http"; // Import REST helper

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";
export const messageApi = {
  // שליפת היסטוריית הודעות לפי סוג ערוץ (למשל: בוט למשגיח) 
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

  // שליחת הודעה/שאלה לבוט או לצוות 
  sendMessage: async (examId, payload) => {
    if (useMock) return { id: Date.now(), text: payload.text, sender: 'me', timestamp: "10:00" };
    return apiFetch(`/chat/${examId}`, { method: "POST", body: payload });
  }
};