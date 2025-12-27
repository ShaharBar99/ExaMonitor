export const messageApi = {
  getMessages: async (examId, type) => {
    await new Promise(resolve => setTimeout(resolve, 400));

    const allMocks = {
      // 1. מהמשגיח בכיתה אל משגיח הקומה
      "supervisor_to_floor": [
        { id: 1, text: "כאן חדר 302, חסרים לי טפסים", sender: "me", role: "supervisor", timestamp: "09:00" },
        { id: 2, text: "מביא לך עכשיו", sender: "other", role: "floor_manager", timestamp: "09:02" }
      ],
      // 2. ממשגיח הקומה אל המשגיחים (צ'אט צוות/הודעות כלליות)
      "floor_to_supervisor": [
        { id: 3, text: "נא לוודא שכל התיקים בקדמת הכיתה", sender: "me", role: "floor_manager", timestamp: "08:50" }
      ],
      // 3. ממשגיח הקומה אל המרצה
      "floor_to_lecturer": [
        { id: 4, text: "מרצה יקר, יש שאלה בחדר 404 לגבי נספח א'", sender: "me", role: "floor_manager", timestamp: "10:00" }
      ],
      // 4. מהמרצה אל משגיח הקומה
      "lecturer_to_floor": [
        { id: 5, text: "אני נכנס עכשיו לבניין א' לענות על שאלות", sender: "me", role: "lecturer", timestamp: "10:05" }
      ]
    };

    return allMocks[type] || [];
  },

  sendMessage: async (payload) => {
    return {
      id: Date.now(),
      text: payload.text,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
};