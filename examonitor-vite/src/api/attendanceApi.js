import { apiFetch } from './http';

export const attendanceApi = {
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

  mark: async (payload) => {
    return apiFetch('/attendance/mark', {
      method: 'POST',
      body: payload,
    });
  },


  updateStudentStatus: async (studentId, status) => {
    return apiFetch(`/attendance/students/${studentId}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  getExamsOnFloor: async (floorId) => {
    return apiFetch(`/attendance/exams/floor/${floorId}`);
  },

  assignSupervisor: async (roomId, supervisorId) => {
    return apiFetch(`/attendance/rooms/${roomId}/supervisor`, {
      method: 'PATCH',
      body: { supervisorId },
    });
  },

  getFloorSummary: async (floorId) => {
    return apiFetch(`/attendance/rooms/summary?floorId=${floorId}`);
  },

  getStudentsForSupervisor: async (examId, supervisorId) => {
    return apiFetch(`/attendance/supervisor/${supervisorId}/exam/${examId}/students`);
  },

  startBreak: async (studentId, reason) => {
    return apiFetch('/attendance/breaks/start', {
      method: 'POST',
      body: { student_id: studentId, reason },
    });
  },

  endBreak: async (studentId) => {
    return apiFetch('/attendance/breaks/end', {
      method: 'POST',
      body: { student_id: studentId},
    });
  },

  getBreaksCountByExam: async (examId) => {
    return apiFetch(`/attendance/breaks/count?examId=${encodeURIComponent(examId)}`);
  },



  /**
   * הוספת סטודנט ידנית למבחן בחדר ספציפי
   */
  addStudent: async (classroomId, studentProfileId, studentId) => {
    return apiFetch('/attendance/add-manual', {
      method: 'POST',
      body: { classroomId, studentProfileId , studentId},
    });
  },

  /**
   * הסרת סטודנט מרשימת הנוכחות של המבחן
   */
  removeStudent: async (attendanceId) => {
    return apiFetch(`/attendance/${attendanceId}`, {
      method: 'DELETE',
    });
  },

  searchEligibleStudents: async (examId, query) => {
    console.log("Searching eligible students in api for exam ID:", examId, "with search term:", query);
    return apiFetch(`/attendance/exams/${examId}/eligible-students?query=${encodeURIComponent(query)}`);
  },
};