import { messageApi } from "../api/messageApi";
export const messageHandlers = {
  handleSend: async (text, userRole, setMessages) => {
    if (!text || !text.trim()) return;

    const messageText = text.trim();
    const tempId = Date.now();

    // 1. יצירת האובייקט האופטימי
    const optimisticMsg = {
      id: tempId,
      text: messageText, // לוודא שזה 'text'
      sender: 'me',
      isMe: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 2. עדכון ה-UI מיד
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const response = await messageApi.sendMessage({
        text: messageText,
        role: userRole
      });

      // 3. עדכון עם הנתונים מהשרת
      setMessages(prev => 
        prev.map(m => m.id === tempId ? { ...response, isMe: true } : m)
      );
    } catch (error) {
      console.error("Send failed:", error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  },

  initChat: async (examId, chatType, setMessages) => {
    try {
      const data = await messageApi.getMessages(examId, chatType);
      const formatted = data.map(m => ({
        ...m,
        isMe: m.sender === 'me'
      }));
      setMessages(formatted);
    } catch (e) {
      setMessages([]);
    }
  }
};