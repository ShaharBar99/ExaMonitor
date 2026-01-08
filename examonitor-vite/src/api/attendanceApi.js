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

  getStudentsByRoom: async (roomId) => {
    return apiFetch(`/attendance/rooms/${roomId}/students`);
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
};