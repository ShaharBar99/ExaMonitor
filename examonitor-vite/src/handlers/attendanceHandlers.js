import { attendanceApi } from '../api/attendanceApi';

/**
 * Handlers for attendance management logic.
 */
export const attendanceHandlers = {
  /**
   * Initializes the supervisor console with student data.
   * @param {string} examId - The exam ID.
   * @param {string} supervisorId - The supervisor ID.
   * @param {Function} setStudents - State setter for students.
   * @param {Function} setLoading - State setter for loading status.
   * @param {Function} setExamContext - State setter for exam context.
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
   * Loads attendance records for an exam.
   * @param {string} examId - The exam ID.
   * @param {Function} setAttendance - State setter for attendance.
   * @param {Function} setIsLoading - State setter for loading status.
   */
  loadAttendanceByExam: async (examId, setAttendance, setIsLoading) => {
    try {
      if (setIsLoading) setIsLoading(true);
      const data = await attendanceApi.list({ examId });
      setAttendance(data?.attendance || []);
    } catch (error) {
      console.error("Failed to load attendance by exam:", error);
    } finally {
      if (setIsLoading) setIsLoading(false);
    }
  },


  
  /**
   * Loads the count of breaks for an exam.
   * @param {string} examId - The exam ID.
   * @param {Function} setBreaksCount - State setter for breaks count.
   */
  loadBreaksCountByExam: async (examId, setBreaksCount) => {
    try {
      const data = await attendanceApi.getBreaksCountByExam(examId);
      setBreaksCount(data?.count || 0);
    } catch (error) {
      console.error("Failed to load breaks count by exam:", error);
    }
  },

  /**
   * Changes a student's attendance status.
   * @param {string} attendanceId - The attendance record ID.
   * @param {string} newStatus - The new status.
   * @param {Function} setStudents - State setter for students to update UI optimistically.
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
   * Loads a summary for the floor supervisor.
   * @param {string} floorId - The floor ID.
   * @param {Function} setSummary - State setter for summary data.
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
   * Assigns a supervisor to a room.
   * @param {string} roomId - The room ID.
   * @param {string} supervisorId - The supervisor ID.
   * @param {Function} callback - Callback function on success.
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

  /**
   * Gets exams on a specific floor.
   * @param {string} floorId - The floor ID.
   * @param {Function} setExams - State setter for exams.
   */
  handleGetExamsOnFloor: async (floorId, setExams) => {
    try {
      const data = await attendanceApi.getExamsOnFloor(floorId);
      setExams(data);
    } catch (error) {
      console.error("Failed to load exams on floor:", error);
    }
  },

  /**
   * Starts a break for a student.
   * @param {string} studentId - The student ID.
   * @param {string} reason - The reason for the break.
   * @param {Function} setStudents - State setter for students.
   */
  handleStartBreak: async (studentId, reason, setStudents) => {
    try {
      await attendanceApi.startBreak(studentId, reason);
      setStudents(prev => prev.map(s => s.id === studentId || s.attendanceId === studentId ? { ...s, status: 'exited_temporarily' } : s));
    } catch (error) {
      console.error("Failed to start break:", error);
      alert("נכשל בהתחלת הפסקה: סטודנט אחר נמצא בשירותים");
    }
  },

  /**
   * Ends a break for a student.
   * @param {string} studentId - The student ID.
   * @param {Function} setStudents - State setter for students.
   */
  handleEndBreak: async (studentId, setStudents) => {
    try {
      await attendanceApi.endBreak(studentId);
      setStudents(prev => 
        prev.map(s => 
          // בודקים אם הסטודנט הנוכחי בלולאה הוא זה שחזר מהשירותים
          (s.id === studentId || s.attendanceId === studentId || s.studentId === studentId) 
            ? { ...s, status: 'present' } // רק אותו מעדכנים
            : s // כל השאר נשארים כפי שהיו
        )
      );
    } catch (error) {
      console.error("Failed to end break:", error);
      alert("נכשל בסיום הפסקה");
    }
  },
  // src/handlers/attendanceHandlers.js

  /**
   * Adds a student to the attendance list.
   * @param {string} classroomId - The classroom ID.
   * @param {string} studentProfileId - The student profile ID.
   * @param {Function} setStudents - State setter for students.
   * @param {string} [studentId=null] - Optional student ID.
   */
  handleAddStudent: async (classroomId, studentProfileId, setStudents, studentId=null) => {
    try {
      console.log("Adding student:", studentProfileId, "to classroom:", classroomId);
      const newRecord = await attendanceApi.addStudent(classroomId, studentProfileId, studentId);
      console.log("Server returned new attendance record:", newRecord);
      // יצירת אובייקט סטודנט תואם ל-UI מתוך התשובה של השרת
      const newStudentUI = {
        ...newRecord, // שומר על הכל (status, check_in_time וכו')
        id: newRecord.id, // ה-UUID של ה-attendance (קריטי להפסקות!)
        student_id: newRecord.profiles?.student_id || newRecord.student_id,
        name: newRecord.profiles?.full_name || "סטודנט חדש",
        // אם שאר הקוד שלך מצפה ל-profiles אובייקט, נשמור גם אותו
        profiles: newRecord.profiles 
    };

      setStudents(prev => {
        // מניעת כפילויות ב-State למקרה שהסטודנט כבר קיים
        const exists = prev.find(s => s.id === newStudentUI.id);
        if (exists) return prev;
        return [...prev, newStudentUI];
      });
      alert("הסטודנט נוסף בהצלחה!");
    } catch (error) {
      alert(error.message || "נכשל בהוספת הסטודנט");
    }
  },

    /**
     * Removes a student from the attendance list.
     * @param {string} studentId - The student ID to remove.
     * @param {Function} setStudents - State setter for students.
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
       * Searches for eligible students.
       * @param {string} examId - The exam ID.
       * @param {string} query - The search query.
       * @param {Function} setSearchResults - State setter for search results.
       * @param {Function} setIsSearching - State setter for searching status.
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