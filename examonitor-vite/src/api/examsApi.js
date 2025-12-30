export const examsApi = {
  // קבלת פרטי מבחן ספציפי
  getExamById: async (examId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: examId,
          name: "מבוא למדעי המחשב",
          courseId: "CS101",
          startTime: new Date().toISOString(),
          duration: 180, // דקות
          status: "started"
        });
      }, 500);
    });
  },

  // שליחת הודעה מנהלתית מתפרצת (Broadcast)
  broadcastAnnouncement: async (examId, message) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Fake API: Announcement for exam ${examId}: ${message}`);
        resolve({ success: true, timestamp: new Date().toISOString() });
      }, 400);
    });
  },

  // שינוי סטטוס בחינה (started, paused, ended)
  updateExamStatus: async (examId, status) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Fake API: Exam ${examId} status updated to: ${status}`);
        resolve({ success: true, newStatus: status });
      }, 400);
    });
  }
};

// Actual usage:
// export const examsApi = {
//   // GET /exams/:id
//   getExamById: async (examId) => {
//     // קבלת פרטי מבחן ליבה (שם, קוד, משך)
//     return http.get(`/exams/${examId}`);
//   },



//   // POST /exams/:id/broadcast
//   broadcastAnnouncement: async (examId, message) => {
//     // שליחת הודעה מנהלתית מתפרצת לכלל המעורבים בבחינה
//     return http.post(`/exams/${examId}/broadcast`, { message });
//   },

//   // PATCH /exams/:id/status
//   updateExamStatus: async (examId, status) => {
//     // שינוי סטטוס בחינה (started, paused, ended)
//     return http.patch(`/exams/${examId}/status`, { status });
//   }
// };