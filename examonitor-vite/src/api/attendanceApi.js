export const attendanceApi = {
  // קבלת רשימת סטודנטים בחדר
  getStudentsByRoom: async (roomId) => {
    return [
      { id: "123456789", name: "ישראל ישראלי", status: "במבחן", desk: 1 },
      { id: "987654321", name: "שרה כהן", status: "סיים", desk: 2 },
      { id: "456789123", name: "אבי לוי", status: "שירותים", desk: 3 },
    ];
  },
  
  updateStatus: async (studentId, status) => {
    console.log(`API: Student ${studentId} status updated to ${status}`);
    return { success: true };
  }
};