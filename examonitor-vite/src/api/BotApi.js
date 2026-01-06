// src/api/botAPI.js
//import { http } from './http'; 
import { botResponses } from "../mocks/botMessagesMock";

// שנה ל-false כשאתה רוצה להתחבר לשרת אמיתי
const IS_MOCK_MODE = true;

export const botAPI = {
  /**
   * שליחת הודעה לשרת ה-AI
   * @param {Object} payload - האובייקט מה-Handler
   */
  async postChatMessage({ message, role, examId }) {
    try {
      // --- מצב סימולציה (Mock Mode) ---
      if (IS_MOCK_MODE) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // דימוי זמן תגובה של שרת
        const randomReply = botResponses[Math.floor(Math.random() * botResponses.length)];
        return { 
          reply: randomReply, 
          status: "success" 
        };
      }

      // --- מצב אמת (Real API) ---
      // Uncaught SyntaxError: The requested module '/src/api/http.js' does not provide an export named 'default' (at BotApi.js:2:8)
      // הפתרון: שימוש ב-{ http } במקום import http גלובלי
    //   const response = await http.post('/api/bot/chat', {
    //     text: message,
    //     userContext: {
    //       role,
    //       examId,
    //       timestamp: new Date().toISOString()
    //     }
    //   });

      return response.data; 
      
    } catch (error) {
      console.error("Bot API Error:", error.response?.data || error.message);
      throw error; 
    }
  },

  /**
   * בדיקת סטטוס הבוט
   */
  async getBotStatus() {
    if (IS_MOCK_MODE) return { status: "online", mock: true };
    
    const response = await http.get('/api/bot/status');
    return response.data;
  }
};