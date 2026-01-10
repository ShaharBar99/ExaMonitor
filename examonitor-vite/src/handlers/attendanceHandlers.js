import { attendanceApi } from '../api/attendanceApi';

export const attendanceHandlers = {
  /**
   * אתחול מסך ניהול הכיתה עבור משגיח
   */
  initSupervisorConsole: async (examId, supervisorId, setStudents, setLoading, setExamContext) => {
    try {
      if (setLoading) setLoading(true);
      
      // משיכת נתוני הסטודנטים מה-API
      const students = await attendanceApi.getStudentsForSupervisor(examId, supervisorId);
      setStudents(students);
      // עדכון הקונטקסט בפרטי המבחן
      if (setExamContext) {
        setExamContext(prev => ({
          ...prev,
          examId: examId,
          lastSync: new Date().toLocaleTimeString()
        }));
      }
    } catch (error) {
      console.error("Supervisor initialization failed:", error);
      alert("נכשל בטעינת נתוני הכיתה");
    } finally {
      if (setLoading) setLoading(false);
    }
  },

  /**
   * שינוי סטטוס סטודנט (כולל עדכון UI מקומי)
   */
  changeStudentStatus: async (attendanceId, newStatus, setStudents) => {
    // Map Hebrew statuses to English database values
    const statusMap = {
      'סיים': 'finished',
      'במבחן': 'present',
      'שירותים': 'exited_temporarily'
    };
    const mappedStatus = statusMap[newStatus] || newStatus;

    try {
      console.log(`Updating status for attendanceId ${attendanceId} to ${mappedStatus}`);
      // עדכון השרת בשימוש בשם הפונקציה המדויק: updateStudentStatus
      const updatedData = await attendanceApi.updateStudentStatus(attendanceId, mappedStatus);
      console.log("Server responded with updated data:", updatedData);
      // עדכון ה-State של React בצורה אופטימית
      setStudents(prevStudents => {
        return prevStudents.map(student => {
          if (student.id === attendanceId) { 
            console.log(`Found it! Updating status to: ${mappedStatus}`);
            return { 
              ...student, 
              status: mappedStatus 
            }; 
          }
          // --- השורה החסרה שהייתה חסרה לך: ---
          return student; 
        });
      });
    
    console.log("State updated locally");
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("חלה שגיאה בעדכון הסטטוס בשרת");
    }
  },

  /**
   * טעינת סיכום קומה (עבור מנהל קומה)
   */
  loadFloorSummary: async (floorId, setSummary) => {
    try {
      const data = await attendanceApi.getFloorSummary(floorId);
      setSummary(data);
    } catch (error) {
      console.error("Failed to load floor summary:", error);
    }
  },

  /**
   * שיבוץ משגיח לחדר (פעולת מנהיגות)
   */
  handleAssignSupervisor: async (roomId, supervisorId, callback) => {
    try {
      await attendanceApi.assignSupervisor(roomId, supervisorId);
      if (callback) callback();
      alert(`משגיח שובץ בהצלחה לחדר ${roomId}`);
    } catch (error) {
      console.error("Assignment failed:", error);
      alert("שיבוץ המשגיח נכשל");
    }
  },
  handleGetExamsOnFloor: async (floorId, setExams) => {
    try {
      const data = await attendanceApi.getExamsOnFloor(floorId);
      setExams(data);
    } catch (error) {
      console.error("Failed to load exams on floor:", error);
    }
  },

  /**
   * התחלת הפסקה לסטודנט
   */
  startBreak: async (studentId, reason, setStudents) => {
    try {
      await attendanceApi.startBreak(studentId, reason);
      setStudents(prev => prev.map(s => s.id === studentId || s.attendanceId === studentId ? { ...s, status: 'exited_temporarily' } : s));
    } catch (error) {
      console.error("Failed to start break:", error);
      alert("נכשל בהתחלת הפסקה");
    }
  },

  /**
   * סיום הפסקה לסטודנט
   */
  endBreak: async (studentId, setStudents) => {
    try {
      await attendanceApi.endBreak(studentId);
      setStudents(prev => prev.map(s => s.id || s.attendanceId ? { ...s, status: 'present' } : s));
    } catch (error) {
      console.error("Failed to end break:", error);
      alert("נכשל בסיום הפסקה");
    }
  },
  // src/handlers/attendanceHandlers.js

  /**
   * הוספת סטודנט לרשימת הנוכחות
   */
  handleAddStudent: async (classroomId, studentProfileId, setStudents) => {
    try {
      console.log("Adding student:", studentProfileId, "to classroom:", classroomId);
      const newRecord = await attendanceApi.addStudent(classroomId, studentProfileId);
      console.log("Server returned new attendance record:", newRecord);
      // יצירת אובייקט סטודנט תואם ל-UI מתוך התשובה של השרת
      const newStudentUI = {
        attendanceId: newRecord.id,
        id: newRecord.profiles.id,
        name: newRecord.profiles.full_name,
        status: newRecord.status
      };

      setStudents(prev => [...prev, newStudentUI]);
      alert("הסטודנט נוסף בהצלחה!");
    } catch (error) {
      alert(error.message || "נכשל בהוספת הסטודנט");
    }
  },

    /**
     * הסרת סטודנט (ביטול נוכחות)
     */
    handleRemoveStudent: async (studentId, setStudents) => {

      try {
        await attendanceApi.removeStudent(studentId);
        
        // עדכון ה-State של React - הסרת הסטודנט מהמערך
        setStudents(prev => prev.filter(s => s.id !== studentId));
      } catch (error) {
        console.error("Remove failed:", error);
        alert("נכשל בהסרת הסטודנט");
      }
    },
    /**
     * לוגיקת חיפוש סטודנטים בזמן אמת
     */
    handleSearchEligible: async (examId, query, setSearchResults, setIsSearching) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await attendanceApi.searchEligibleStudents(examId, query);
      setSearchResults(results || []); // עדכון ה-State ישירות
    } catch (error) {
      console.error("Search error in handler:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  },
};