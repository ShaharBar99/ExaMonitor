import { apiFetch } from './http';

/**
 * API for managing attendance records.
 */
export const attendanceApi = {
  /**
   * Lists attendance records based on classroom or exam ID.
   * @param {Object} params - Filter parameters.
   * @param {string} [params.classroomId] - The classroom ID to filter by.
   * @param {string} [params.examId] - The exam ID to filter by.
   * @returns {Promise<Object>} The list of attendance records.
   */
  list: async ({ classroomId, examId }) => {
    const params = new URLSearchParams();
    if (classroomId) {
      params.set('classroom_id', classroomId);
    }
    if (examId) {
      params.set('exam_id', examId);
    }
    return apiFetch(`/attendance?${params.toString()}`);
  },

  /**
   * Marks attendance for a student.
   * @param {Object} payload - The attendance data.
   * @returns {Promise<Object>} The result of the operation.
   */
  mark: async (payload) => {
    return apiFetch('/attendance/mark', {
      method: 'POST',
      body: payload,
    });
  },


  /**
   * Updates the status of a student's attendance.
   * @param {string} studentId - The ID of the student.
   * @param {string} status - The new status.
   * @returns {Promise<Object>} The updated record.
   */
  updateStudentStatus: async (studentId, status) => {
    return apiFetch(`/attendance/students/${studentId}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  /**
   * Retrieves exams scheduled on a specific floor.
   * @param {string} floorId - The ID of the floor.
   * @returns {Promise<Object>} List of exams.
   */
  getExamsOnFloor: async (floorId) => {
    return apiFetch(`/attendance/exams/floor/${floorId}`);
  },

  /**
   * Assigns a supervisor to a room.
   * @param {string} roomId - The room ID.
   * @param {string} supervisorId - The supervisor ID.
   * @returns {Promise<Object>} The result.
   */
  assignSupervisor: async (roomId, supervisorId) => {
    return apiFetch(`/attendance/rooms/${roomId}/supervisor`, {
      method: 'PATCH',
      body: { supervisorId },
    });
  },

  /**
   * Gets a summary of attendance/exams for a floor.
   * @param {string} floorId - The floor ID.
   * @returns {Promise<Object>} The summary data.
   */
  getFloorSummary: async (floorId) => {
    return apiFetch(`/attendance/rooms/summary?floorId=${floorId}`);
  },

  /**
   * Gets students assigned to a supervisor for a specific exam.
   * @param {string} examId - The exam ID.
   * @param {string} supervisorId - The supervisor ID.
   * @returns {Promise<Object>} List of students.
   */
  getStudentsForSupervisor: async (examId, supervisorId) => {
    return apiFetch(`/attendance/supervisor/${supervisorId}/exam/${examId}/students`);
  },

  /**
   * Starts a break for a student.
   * @param {string} studentId - The student ID.
   * @param {string} reason - The reason for the break.
   * @returns {Promise<Object>} The break record.
   */
  startBreak: async (studentId, reason) => {
    return apiFetch('/attendance/breaks/start', {
      method: 'POST',
      body: { student_id: studentId, reason },
    });
  },

  /**
   * Ends a break for a student.
   * @param {string} studentId - The student ID.
   * @returns {Promise<Object>} The updated break record.
   */
  endBreak: async (studentId) => {
    return apiFetch('/attendance/breaks/end', {
      method: 'POST',
      body: { student_id: studentId},
    });
  },

  /**
   * Gets the count of active breaks for an exam.
   * @param {string} examId - The exam ID.
   * @returns {Promise<Object>} The count object.
   */
  getBreaksCountByExam: async (examId) => {
    return apiFetch(`/attendance/breaks/count?examId=${encodeURIComponent(examId)}`);
  },



  /**
   * Manually adds a student to an exam in a specific classroom.
   * @param {string} classroomId - The classroom ID.
   * @param {string} studentProfileId - The student's profile ID.
   * @param {string} studentId - The student's ID (optional/alternative).
   * @returns {Promise<Object>} The new attendance record.
   */
  addStudent: async (classroomId, studentProfileId, studentId) => {
    return apiFetch('/attendance/add-manual', {
      method: 'POST',
      body: { classroomId, studentProfileId , studentId},
    });
  },

  /**
   * Removes a student from the attendance list.
   * @param {string} attendanceId - The attendance record ID.
   * @returns {Promise<Object>} The result.
   */
  removeStudent: async (attendanceId) => {
    return apiFetch(`/attendance/${attendanceId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Searches for eligible students for an exam.
   * @param {string} examId - The exam ID.
   * @param {string} query - The search query.
   * @returns {Promise<Object>} List of eligible students.
   */
  searchEligibleStudents: async (examId, query) => {
    console.log("Searching eligible students in api for exam ID:", examId, "with search term:", query);
    return apiFetch(`/attendance/exams/${examId}/eligible-students?query=${encodeURIComponent(query)}`);
  },
};