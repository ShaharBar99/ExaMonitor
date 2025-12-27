// src/handlers/attendanceHandlers.js
import { attendanceApi } from '../api/attendanceApi';

export const attendanceHandlers = {
  initConsole: async (examId, setStudents, setLoading, setExamContext) => {
    try {
      setLoading(true);
      // משיכת נתוני הסטודנטים
      const students = await attendanceApi.getStudentsByRoom(examId);
      setStudents(students);
      
      // כאן אנחנו "מעדכנים" את הקונטקסט בפרטי המבחן שחזרו מהשרת
      if (setExamContext) {
        setExamContext({
          id: examId,
          name: "מבוא למדעי המחשב", // נתון שיגיע מה-API
          room: "302"
        });
      }
    } catch (error) {
      console.error("Initialization failed", error);
    } finally {
      setLoading(false);
    }
  },
  changeStudentStatus: async (studentId, newStatus, setStudents) => {
    try {
      // 1. מעדכנים את השרת/API
      await attendanceApi.updateStatus(studentId, newStatus);

      // 2. מעדכנים את ה-UI (ה-State של React)
      // אנחנו עוברים על רשימת הסטודנטים ורק לסטודנט הספציפי משנים את הסטטוס
      setStudents(prevStudents => 
        prevStudents.map(student => 
          student.id === studentId 
            ? { ...student, status: newStatus } 
            : student
        )
      );
    } catch (error) {
      console.error("Failed to update status", error);
      alert("חלה שגיאה בעדכון הסטטוס");
    }
  }
};