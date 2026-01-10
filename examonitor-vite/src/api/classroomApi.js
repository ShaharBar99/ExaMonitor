import { apiFetch } from './http';

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";

export const classroomApi = {
  // GET /classrooms - משיכת כל הכיתות שהמשתמש מורשה לראות
  // examId: filter classrooms for a specific exam
  // lecturerId: filter classrooms for exams whose course.lecturer_id == lecturerId
  getClassrooms: async (examId = null, lecturerId = null) => {
    if (useMock) {
      return [
        { id: "301", examName: "מבוא למדעי המחשב", status: "active", supervisor: "ישראל ישראלי", floor: 3 },
        { id: "302", examName: "אלגוריתמים", status: "warning", supervisor: null, floor: 3 },
        { id: "404", examName: "מבוא למדעי המחשב", status: "active", supervisor: "שרה כהן", floor: 4 },
      ];
    }
    const params = new URLSearchParams();
    if (examId) params.set('exam_id', examId);
    if (lecturerId) params.set('lecturer_id', lecturerId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/classrooms${qs}`);
  },

  // PATCH /classrooms/:id/assign - הקצאת משגיח
  assignSupervisor: async (classroomId, supervisorId) => {
    if (useMock) return { success: true };
    return apiFetch(`/classrooms/${classroomId}/assign`, {
      method: "PATCH",
      body: { supervisor_id: supervisorId }
    });
  },

  // GET /classrooms/supervisors/list - משיכת רשימת משגיחים זמינים
  getSupervisors: async () => {
    if (useMock) {
      return [
        { id: "u3", name: "Invigilator One" },
        { id: "u4", name: "Invigilator Two" },
      ];
    }
    const response = await apiFetch('/classrooms/supervisors/list');
    return response.supervisors || [];
  }
};