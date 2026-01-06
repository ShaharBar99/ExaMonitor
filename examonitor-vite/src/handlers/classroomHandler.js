import { classroomApi } from '../api/classroomApi';

export const classroomHandler = {
  /**
   * טעינת נתונים וסינון לפי תפקיד המשתמש
   */
  loadDisplayData: async (userRole, targetExamName, setExams, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const allRooms = await classroomApi.getClassrooms();

      if (userRole === 'lecturer') {
        // מרצה רואה רק כיתות שקשורות למבחן שלו
        const filtered = allRooms.filter(room => room.examName === targetExamName);
        setExams(filtered);
      } else {
        // משגיח קומה רואה את כל הכיתות בקומה שלו (הסינון מבוצע לרוב בשרת לפי ה-Token)
        setExams(allRooms);
      }
    } catch (error) {
      console.error("Error loading classrooms:", error);
    } finally {
      if (setLoading) setLoading(false);
    }
  },

  /**
   * ביצוע שיבוץ משגיח ורענון הנתונים
   */
  handleAssign: async (classroomId, supervisorId, onSuccess) => {
    try {
      await classroomApi.assignSupervisor(classroomId, supervisorId);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Assignment failed:", error);
      alert("שיבוץ המשגיח נכשל");
    }
  }
};