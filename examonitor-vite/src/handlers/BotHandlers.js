// src/handlers/botHandlers.js
import { botAPI } from '../api/BotApi';

export const botHandlers = {
  // הפונקציה המרכזית שהקומפוננטה תפעיל
  handleSendMessage: async (text, context, onReply, setTyping, stats) => {
    if (!text.trim()) return;

    // 1. הפעלת אינדיקטור טעינה ב-UI
    setTyping(true);
    try {
      // 2. קריאה לשיטה בתוך botAPI.js
      const data = await botAPI.postChatMessage({
        message: text,
        role: context.role,
        examId: context.examId,
        stats: stats
      });

      // 3. החזרת התשובה המעובדת לקומפוננטה
      onReply({
        role: "bot",
        text: data.reply, // הנתון שמגיע מה-API
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        actions: data.actions || [] // אם הבוט מחזיר כפתורי פעולה
      });

    } catch (error) {
      // טיפול בשגיאות ברמת ה-UI
      onReply({
        role: "bot",
        text: "מצטער, חלה שגיאה בחיבור לשרת. האם תרצה שאנסה שוב?",
        time: "שגיאה",
        isError: true
      });
    } finally {
      // 4. כיבוי אינדיקטור הטעינה
      setTyping(false);
    }
  },

  // דוגמה לשיטה נוספת שה-Handler יכול לקרוא לה בטעינת הדף
  initializeBot: async (setBotStatus) => {
    try {
      const status = await botAPI.getBotStatus();
      setBotStatus(status.online ? 'מחובר' : 'לא מקוון');
    } catch (e) {
      setBotStatus('שגיאה');
    }
  }
};