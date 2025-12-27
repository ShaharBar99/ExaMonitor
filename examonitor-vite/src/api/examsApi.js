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
        });
      }, 500);
    });
  }
};